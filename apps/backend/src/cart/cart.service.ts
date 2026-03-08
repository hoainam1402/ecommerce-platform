import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  // ─── Lấy hoặc tạo cart ────────────────────────────────────
  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.images', 'items.variant'],
    });

    if (!cart) {
      cart = this.cartRepo.create({ userId });
      await this.cartRepo.save(cart);
      cart.items = [];
    }

    return this.enrichCart(cart);
  }

  // ─── Thêm sản phẩm vào giỏ ────────────────────────────────
  async addItem(userId: string, dto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateRaw(userId);

    // Kiểm tra product tồn tại
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['variants'],
    });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    // Kiểm tra variant và tồn kho
    let unitPrice = Number(product.salePrice ?? product.basePrice);
    let availableQty = Infinity;

    if (dto.variantId) {
      const variant = await this.variantRepo.findOne({
        where: { id: dto.variantId, productId: dto.productId, isActive: true },
      });
      if (!variant) throw new NotFoundException('Phiên bản sản phẩm không tồn tại');

      availableQty = variant.stockQuantity - variant.reservedQty;
      unitPrice = Number(variant.salePrice ?? variant.price ?? product.salePrice ?? product.basePrice);
    } else if (product.variants?.length > 0) {
      throw new BadRequestException('Vui lòng chọn phiên bản sản phẩm');
    }

    // Kiểm tra tồn kho
    const existing = await this.itemRepo.findOne({
      where: { cartId: cart.id, variantId: dto.variantId ?? null as any },
    });
    const currentQty = existing?.quantity ?? 0;
    const totalQty   = currentQty + dto.quantity;

    if (totalQty > availableQty) {
      throw new BadRequestException(
        `Chỉ còn ${availableQty} sản phẩm trong kho`,
      );
    }

    if (existing) {
      // Cập nhật số lượng
      existing.quantity = totalQty;
      existing.unitPrice = unitPrice;
      await this.itemRepo.save(existing);
    } else {
      // Thêm mới
      const item = this.itemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        unitPrice,
      });
      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  // ─── Cập nhật số lượng ────────────────────────────────────
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreateRaw(userId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: ['variant'],
    });
    if (!item) throw new NotFoundException('Sản phẩm không có trong giỏ');

    if (dto.quantity === 0) {
      await this.itemRepo.remove(item);
    } else {
      // Kiểm tra tồn kho
      if (item.variant) {
        const avail = item.variant.stockQuantity - item.variant.reservedQty;
        if (dto.quantity > avail) {
          throw new BadRequestException(`Chỉ còn ${avail} sản phẩm`);
        }
      }
      item.quantity = dto.quantity;
      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  // ─── Xóa item ─────────────────────────────────────────────
  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getOrCreateRaw(userId);
    const item = await this.itemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Sản phẩm không có trong giỏ');
    await this.itemRepo.remove(item);
    return this.getCart(userId);
  }

  // ─── Xóa toàn bộ giỏ (sau khi đặt hàng) ──────────────────
  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepo.findOne({ where: { userId } });
    if (cart) {
      await this.itemRepo.delete({ cartId: cart.id });
    }
  }

  // ─── Lấy raw cart (không enrich) ──────────────────────────
  async getCartWithItems(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.variant'],
    });
    if (!cart) {
      cart = this.cartRepo.create({ userId });
      await this.cartRepo.save(cart);
      cart.items = [];
    }
    return cart;
  }

  // ─── Internal ─────────────────────────────────────────────
  private async getOrCreateRaw(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({ where: { userId } });
    if (!cart) {
      cart = this.cartRepo.create({ userId });
      await this.cartRepo.save(cart);
    }
    return cart;
  }

  private enrichCart(cart: Cart): Cart {
    // Tính subtotal
    const subtotal = (cart.items ?? []).reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity, 0,
    );
    (cart as any).subtotal   = subtotal;
    (cart as any).itemCount  = (cart.items ?? []).reduce((s, i) => s + i.quantity, 0);

    // Đánh dấu sản phẩm hết hàng
    for (const item of cart.items ?? []) {
      const avail = item.variant
        ? item.variant.stockQuantity - item.variant.reservedQty
        : Infinity;
      (item as any).isOutOfStock = avail <= 0;
      (item as any).maxQty       = isFinite(avail) ? avail : null;
    }
    return cart;
  }
}
