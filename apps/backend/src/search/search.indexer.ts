import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductDocument } from './search.dto';
import { SearchService } from './search.service';

@Injectable()
export class SearchIndexer {
  private readonly logger = new Logger(SearchIndexer.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly searchService: SearchService,
  ) {}

  // ─── Convert Product entity → ES document ─────────────────
  toDocument(product: Product): ProductDocument {
    const primaryImage = product.images?.find(img => img.isPrimary)
      ?? product.images?.[0];

    const categories = product.categories ?? [];

    return {
      id:               product.id,
      name:             product.name,
      slug:             product.slug,
      sku:              product.sku ?? '',
      description:      product.description ?? '',
      shortDescription: product.shortDescription ?? '',
      basePrice:        Number(product.basePrice),
      salePrice:        product.salePrice ? Number(product.salePrice) : null,
      brandId:          product.brandId ?? '',
      brandName:        (product as any).brand?.name ?? '',
      categoryIds:      categories.map((c: any) => c.id ?? ''),
      categoryNames:    categories.map((c: any) => c.name ?? ''),
      tags:             product.tags ?? [],
      avgRating:        Number(product.avgRating),
      reviewCount:      product.reviewCount,
      soldCount:        product.soldCount,
      viewCount:        product.viewCount,
      status:           product.status,
      isFeatured:       product.isFeatured,
      primaryImage:     primaryImage?.url ?? null,
      updatedAt:        product.updatedAt?.toISOString(),
    };
  }

  // ─── Index 1 sản phẩm (gọi sau create/update) ────────────
  async indexOne(productId: string): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['brand', 'images', 'productCategories', 'productCategories.category'],
    });

    if (!product) return;
    const doc = this.toDocument(product);
    await this.searchService.indexProduct(doc);
  }

  // ─── Xóa khỏi index (gọi sau soft delete) ────────────────
  async removeOne(productId: string): Promise<void> {
    await this.searchService.removeProduct(productId);
  }

  // ─── Reindex toàn bộ sản phẩm active ─────────────────────
  async reindexAll(): Promise<{ indexed: number; total: number }> {
    this.logger.log('Starting full reindex...');

    const products = await this.productRepo.find({
      where: { status: 'active' as any },
      relations: ['brand', 'images', 'productCategories', 'productCategories.category'],
    });

    const docs = products.map(p => this.toDocument(p));
    const result = await this.searchService.reindexAll(docs);

    this.logger.log(`Reindex complete: ${result.indexed}/${products.length} products`);
    return { indexed: result.indexed, total: products.length };
  }
}