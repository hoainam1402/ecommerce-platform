import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, IsNull, In } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { InventoryTransaction, InventoryReason } from './entities/inventory-transaction.entity';
import { Category } from './entities/category.entity';
import {
  CreateProductDto, UpdateProductDto,
  ProductQueryDto, AdjustStockDto,
} from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(InventoryTransaction)
    private readonly inventoryRepo: Repository<InventoryTransaction>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @Optional() private readonly searchIndexer?: any,   // SearchIndexer — optional để tránh circular
  ) {}

  // ─── Danh sách sản phẩm (public) ──────────────────────────
  async findAll(query: ProductQueryDto): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, q, categoryId, brandId, minPrice, maxPrice, minRating, sort, status } = query;

    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.categories', 'category')
      .leftJoinAndSelect('p.images', 'image', 'image.isPrimary = true')
      .where('p.deletedAt IS NULL');

    // Filter
    if (status) {
      qb.andWhere('p.status = :status', { status });
    } else {
      qb.andWhere('p.status = :status', { status: ProductStatus.ACTIVE });
    }

    if (q) {
      qb.andWhere('(p.name ILIKE :q OR p.sku ILIKE :q OR p.tags @> ARRAY[:q]::text[])', { q: `%${q}%` });
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (brandId) {
      qb.andWhere('p.brandId = :brandId', { brandId });
    }

    if (minPrice !== undefined) {
      qb.andWhere('COALESCE(p.salePrice, p.basePrice) >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('COALESCE(p.salePrice, p.basePrice) <= :maxPrice', { maxPrice });
    }

    if (minRating) {
      qb.andWhere('p.avgRating >= :minRating', { minRating });
    }

    // Sort
    this.applySort(qb, sort);

    // Pagination
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  // ─── Chi tiết sản phẩm ────────────────────────────────────
  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['brand', 'categories', 'images', 'variants', 'variants.images'],
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { slug, deletedAt: IsNull() },
      relations: ['brand', 'categories', 'images', 'variants', 'variants.images'],
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // Tăng view count (async, không block)
    this.productRepo.increment({ id: product.id }, 'viewCount', 1).catch(() => {});

    return product;
  }

  // ─── Tạo sản phẩm ─────────────────────────────────────────
  async create(dto: CreateProductDto): Promise<Product> {
    // Check slug
    const exists = await this.productRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Slug đã tồn tại');

    // Check SKU
    if (dto.sku) {
      const skuExists = await this.productRepo.findOne({ where: { sku: dto.sku } });
      if (skuExists) throw new ConflictException('SKU đã tồn tại');
    }

    // Load categories
    let categories: Category[] = [];
    if (dto.categoryIds?.length) {
      categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
    }

    // Create product
    const { variants, categoryIds, ...productData } = dto;
    const product = this.productRepo.create({ ...productData, categories });
    await this.productRepo.save(product);

    // Create variants
    if (variants?.length) {
      const variantEntities = variants.map((v: any) =>
        this.variantRepo.create({ ...v, productId: product.id }),
      );
      for (const ve of variantEntities) { await this.variantRepo.save(ve); }
    }

    const saved = await this.findById(product.id);
    // Async index — không block response
    this.searchIndexer?.indexOne(saved.id).catch(() => {});
    return saved;
  }

  // ─── Cập nhật sản phẩm ────────────────────────────────────
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (dto.slug && dto.slug !== product.slug) {
      const exists = await this.productRepo.findOne({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException('Slug đã tồn tại');
    }

    // Cập nhật categories
    if (dto.categoryIds !== undefined) {
      product.categories = dto.categoryIds.length
        ? await this.categoryRepo.findBy({ id: In(dto.categoryIds) })
        : [];
    }

    const updated = await this.productRepo.save(product);
    this.searchIndexer?.indexOne(updated.id).catch(() => {});
    return updated;
  }

  // ─── Xóa sản phẩm (soft delete) ───────────────────────────
  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.productRepo.softDelete(id);
    this.searchIndexer?.removeOne(id).catch(() => {});
  }

  // ─── Quản lý variants ─────────────────────────────────────
  async addVariant(productId: string, dto: any): Promise<any> {
    await this.findById(productId);
    if (dto.sku) {
      const exists = await this.variantRepo.findOne({ where: { sku: dto.sku } });
      if (exists) throw new ConflictException('SKU variant đã tồn tại');
    }
    const variant = this.variantRepo.create({ ...dto, productId } as any);
    return this.variantRepo.save(variant as any);
  }

  async updateVariant(variantId: string, dto: any): Promise<any> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant không tồn tại');
    Object.assign(variant, dto);
    return this.variantRepo.save(variant);
  }

  async removeVariant(variantId: string): Promise<void> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant không tồn tại');
    await this.variantRepo.remove(variant);
  }

  // ─── Quản lý tồn kho ──────────────────────────────────────
  async adjustStock(
    variantId: string,
    dto: AdjustStockDto,
    userId?: string,
  ): Promise<ProductVariant> {
    const variant = await this.variantRepo.findOne({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant không tồn tại');

    const newQty = variant.stockQuantity + dto.quantityChange;
    if (newQty < 0) {
      throw new BadRequestException(
        `Không đủ tồn kho. Hiện có: ${variant.stockQuantity}, thay đổi: ${dto.quantityChange}`,
      );
    }

    variant.stockQuantity = newQty;

    // Cập nhật status sản phẩm nếu hết hàng tất cả variants
    if (newQty === 0) {
      const siblings = await this.variantRepo.find({ where: { productId: variant.productId, isActive: true } });
      const allOutOfStock = siblings.every(v => v.id === variantId || v.stockQuantity === 0);
      if (allOutOfStock) {
        await this.productRepo.update(variant.productId, { status: ProductStatus.OUT_OF_STOCK });
      }
    } else {
      // Có hàng lại → active
      await this.productRepo.update(
        { id: variant.productId, status: ProductStatus.OUT_OF_STOCK },
        { status: ProductStatus.ACTIVE },
      );
    }

    await this.variantRepo.save(variant);

    // Ghi inventory log
    const tx = this.inventoryRepo.create({
      variantId,
      quantityChange: dto.quantityChange,
      quantityAfter: newQty,
      reason: dto.quantityChange > 0 ? InventoryReason.RESTOCK : InventoryReason.ADJUSTMENT,
      note: dto.note,
      createdBy: userId,
    });
    await this.inventoryRepo.save(tx);

    return variant;
  }

  async getInventoryHistory(variantId: string): Promise<InventoryTransaction[]> {
    return this.inventoryRepo.find({
      where: { variantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ─── Thêm/xóa ảnh ─────────────────────────────────────────
  async addImage(productId: string, data: {
    url: string; altText?: string; variantId?: string; isPrimary?: boolean;
  }): Promise<ProductImage> {
    if (data.isPrimary) {
      await this.imageRepo.update({ productId, isPrimary: true }, { isPrimary: false });
    }
    const image = this.imageRepo.create({ ...data, productId });
    return this.imageRepo.save(image);
  }

  async removeImage(imageId: string): Promise<void> {
    await this.imageRepo.delete(imageId);
  }

  // ─── Sản phẩm liên quan ───────────────────────────────────
  async getRelated(productId: string, limit = 8): Promise<Product[]> {
    const product = await this.findById(productId);
    const categoryIds = product.categories.map((c: any) => c.id);

    return this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img', 'img.isPrimary = true')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoin('p.categories', 'cat')
      .where('p.id != :id', { id: productId })
      .andWhere('p.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('p.deletedAt IS NULL')
      .andWhere(categoryIds.length ? 'cat.id IN (:...catIds)' : '1=1',
        categoryIds.length ? { catIds: categoryIds } : {})
      .orderBy('p.soldCount', 'DESC')
      .take(limit)
      .getMany();
  }

  // ─── Internal: sort ───────────────────────────────────────
  private applySort(qb: SelectQueryBuilder<Product>, sort?: string): void {
    switch (sort) {
      case 'price_asc':    qb.orderBy('COALESCE(p.salePrice, p.basePrice)', 'ASC'); break;
      case 'price_desc':   qb.orderBy('COALESCE(p.salePrice, p.basePrice)', 'DESC'); break;
      case 'best_seller':  qb.orderBy('p.soldCount', 'DESC'); break;
      case 'top_rated':    qb.orderBy('p.avgRating', 'DESC'); break;
      default:             qb.orderBy('p.createdAt', 'DESC'); break; // newest
    }
  }
}
