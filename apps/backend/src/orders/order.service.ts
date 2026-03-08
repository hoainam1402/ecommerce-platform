import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Promotion, PromotionStatus, PromotionType } from '../promotions/promotion.entity';
import { UserAddress } from '../users/entities/user-address.entity';
import { LoyaltyService } from '../users/loyalty.service';
import { CancelOrderDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { Shipment, ShippingProvider } from './entities/shipment.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
    @InjectRepository(UserAddress)
    private readonly addressRepo: Repository<UserAddress>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    private readonly cartService: CartService,
    private readonly loyaltyService: LoyaltyService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Tạo đơn hàng từ giỏ hàng ────────────────────────────
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Lấy giỏ hàng
    const cart = await this.cartService.getCartWithItems(userId);
    if (!cart.items?.length) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // 2. Kiểm tra địa chỉ
    const address = await this.addressRepo.findOne({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Địa chỉ không tồn tại');

    // 3. Kiểm tra tồn kho tất cả item
    for (const item of cart.items) {
      if (item.variantId) {
        const variant = await this.variantRepo.findOne({ where: { id: item.variantId } });
        if (!variant || variant.stockQuantity - variant.reservedQty < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${item.product?.name}" không đủ số lượng trong kho`,
          );
        }
      }
    }

    // 4. Tính subtotal
    const subtotal = cart.items.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity, 0,
    );

    // 5. Tính discount từ promotion code
    let discountAmount = 0;
    let promotion: Promotion | null = null;

    if (dto.promotionCode) {
      promotion = await this.validatePromotion(dto.promotionCode, userId, subtotal);
      discountAmount = this.calcDiscount(promotion, subtotal);
    }

    // 6. Tính điểm thưởng sử dụng
    let pointsUsed = 0;
    let pointsDiscount = 0;

    if (dto.pointsToUse && dto.pointsToUse > 0) {
      const loyalty = await this.loyaltyService.getLoyalty(userId);
      const maxPoints = loyalty.points;
      const maxByOrder = Math.floor((subtotal - discountAmount) * 0.3 / 1000); // tối đa 30%
      pointsUsed    = Math.min(dto.pointsToUse, maxPoints, maxByOrder);
      pointsDiscount = pointsUsed * 1000; // 1 điểm = 1.000đ
    }

    const totalDiscount  = discountAmount + pointsDiscount;
    const shippingFee    = this.calcShippingFee(dto.shippingProvider, subtotal);
    const totalAmount    = Math.max(0, subtotal - totalDiscount + shippingFee);
    const pointsEarned   = Math.floor(totalAmount / 100000); // 100k = 1 điểm

    // 7. Tạo order number
    const orderNumber = await this.generateOrderNumber();

    // 8. Transaction: tạo order + trừ tồn kho + xóa giỏ
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Tạo Order
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId,
        shippingName:     address.recipientName,
        shippingPhone:    address.recipientPhone,
        shippingProvince: address.province,
        shippingDistrict: address.district,
        shippingWard:     address.ward,
        shippingAddress:  address.streetAddress,
        status:           OrderStatus.PENDING,
        note:             dto.note,
        subtotal,
        shippingFee,
        discountAmount:   totalDiscount,
        totalAmount,
        pointsUsed,
        pointsEarned,
        promotionId:      promotion?.id,
        promotionCode:    dto.promotionCode,
      });
      const savedOrder = await queryRunner.manager.save(order);

      // Tạo OrderItems + trừ tồn kho
      for (const cartItem of cart.items) {
        const primaryImage = cartItem.product?.images?.find((img: any) => img.isPrimary)
          ?? cartItem.product?.images?.[0];

        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId:      savedOrder.id,
          productId:    cartItem.productId,
          variantId:    cartItem.variantId,
          productName:  cartItem.product?.name ?? '',
          variantName:  cartItem.variant?.name,
          productImage: primaryImage?.url,
          sku:          cartItem.variant?.sku ?? cartItem.product?.sku,
          quantity:     cartItem.quantity,
          unitPrice:    cartItem.unitPrice,
          totalPrice:   Number(cartItem.unitPrice) * cartItem.quantity,
        });
        await queryRunner.manager.save(orderItem);

        // Trừ tồn kho variant
        if (cartItem.variantId) {
          await queryRunner.manager.decrement(
            ProductVariant,
            { id: cartItem.variantId },
            'stockQuantity',
            cartItem.quantity,
          );
        }
      }

      // Tạo Payment record
      const payment = queryRunner.manager.create(Payment, {
        orderId: savedOrder.id,
        method:  dto.paymentMethod,
        status:  dto.paymentMethod === PaymentMethod.COD
                   ? PaymentStatus.PENDING
                   : PaymentStatus.PENDING,
        amount:  totalAmount,
      });
      await queryRunner.manager.save(payment);

      // Tạo Shipment record
      const shipment = queryRunner.manager.create(Shipment, {
        orderId:  savedOrder.id,
        provider: dto.shippingProvider as ShippingProvider,
        shippingFee,
        codAmount: dto.paymentMethod === PaymentMethod.COD ? totalAmount : 0,
      });
      await queryRunner.manager.save(shipment);

      // Ghi lịch sử trạng thái
      const history = queryRunner.manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        status:  OrderStatus.PENDING,
        note:    'Đơn hàng mới được tạo',
        changedBy: userId,
      });
      await queryRunner.manager.save(history);

      // Cập nhật promotion used_count
      if (promotion) {
        await queryRunner.manager.increment(
          Promotion, { id: promotion.id }, 'usedCount', 1,
        );
      }

      await queryRunner.commitTransaction();

      // Sau transaction: xóa giỏ hàng + tích điểm
      await this.cartService.clearCart(userId);

      if (pointsUsed > 0) {
        await this.loyaltyService.redeemPoints(userId, pointsUsed, savedOrder.id);
      }

      this.logger.log(`Order ${orderNumber} created for user ${userId}`);
      return this.findById(savedOrder.id, userId);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Lấy danh sách đơn hàng của user ─────────────────────
  async findByUser(
    userId: string,
    page = 1,
    limit = 10,
    status?: OrderStatus,
  ): Promise<{ data: Order[]; total: number }> {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payments', 'payments')
      .leftJoinAndSelect('o.shipments', 'shipments')
      .where('o.userId = :userId', { userId });

    if (status) qb.andWhere('o.status = :status', { status });

    qb.orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // ─── Chi tiết đơn hàng ────────────────────────────────────
  async findById(orderId: string, userId?: string): Promise<Order> {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payments', 'payments')
      .leftJoinAndSelect('o.shipments', 'shipments')
      .leftJoinAndSelect('shipments.events', 'events')
      .where('o.id = :orderId', { orderId });

    if (userId) qb.andWhere('o.userId = :userId', { userId });

    const order = await qb.getOne();
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    return order;
  }

  // ─── Hủy đơn hàng ────────────────────────────────────────
  async cancelOrder(orderId: string, userId: string, dto: CancelOrderDto): Promise<Order> {
    const order = await this.findById(orderId, userId);

    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Không thể hủy đơn hàng đang vận chuyển hoặc đã giao',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Hoàn lại tồn kho
      for (const item of order.items) {
        if (item.variantId) {
          await queryRunner.manager.increment(
            ProductVariant, { id: item.variantId }, 'stockQuantity', item.quantity,
          );
        }
      }

      // Cập nhật order
      await queryRunner.manager.update(Order, orderId, {
        status:       OrderStatus.CANCELLED,
        cancelledAt:  new Date(),
        cancelReason: dto.reason,
      });

      // Ghi lịch sử
      await queryRunner.manager.save(
        queryRunner.manager.create(OrderStatusHistory, {
          orderId,
          status:    OrderStatus.CANCELLED,
          note:      dto.reason,
          changedBy: userId,
        }),
      );

      await queryRunner.commitTransaction();

      // Hoàn điểm nếu đã dùng
      if (order.pointsUsed > 0) {
        await this.loyaltyService.refundPoints(userId, order.pointsUsed, order.id);
      }

      return this.findById(orderId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Admin: cập nhật trạng thái ──────────────────────────
  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminId: string,
  ): Promise<Order> {
    const order = await this.findById(orderId);
    this.validateStatusTransition(order.status, dto.status);

    const timestamps: Partial<Order> = {};
    if (dto.status === OrderStatus.CONFIRMED)  timestamps.confirmedAt = new Date();
    if (dto.status === OrderStatus.PACKED)     timestamps.packedAt    = new Date();
    if (dto.status === OrderStatus.SHIPPED)    timestamps.shippedAt   = new Date();
    if (dto.status === OrderStatus.DELIVERED) {
      timestamps.deliveredAt = new Date();
      // Tích điểm khi giao hàng thành công
      if (order.pointsEarned > 0) {
        await this.loyaltyService.earnPoints(
          order.userId,
          order.pointsEarned * 100000,   // convert points → orderAmount (earnPoints tính lại)
          order.id,
        );
      }
    }

    await this.orderRepo.update(orderId, { status: dto.status, ...timestamps });

    await this.historyRepo.save(
      this.historyRepo.create({
        orderId,
        status:    dto.status,
        note:      dto.note,
        changedBy: adminId,
      }),
    );

    return this.findById(orderId);
  }

  // ─── Admin: danh sách đơn hàng ────────────────────────────
  async findAll(
    page = 1,
    limit = 20,
    status?: OrderStatus,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{ data: Order[]; total: number }> {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payments', 'payments');

    if (status)   qb.andWhere('o.status = :status', { status });
    if (fromDate) qb.andWhere('o.createdAt >= :fromDate', { fromDate });
    if (toDate)   qb.andWhere('o.createdAt <= :toDate', { toDate });

    qb.orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // ─── Helpers ──────────────────────────────────────────────
  private async validatePromotion(
    code: string, userId: string, orderAmount: number,
  ): Promise<Promotion> {
    const promo = await this.promoRepo.findOne({
      where: { code, status: PromotionStatus.ACTIVE },
    });
    if (!promo) throw new BadRequestException('Mã giảm giá không hợp lệ');

    const now = new Date();
    if (promo.startsAt > now)  throw new BadRequestException('Mã chưa có hiệu lực');
    if (promo.expiresAt && promo.expiresAt < now)
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit)
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    if (promo.minOrderValue && orderAmount < Number(promo.minOrderValue))
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()}đ để dùng mã này`,
      );

    return promo;
  }

  private calcDiscount(promo: Promotion, subtotal: number): number {
    if (promo.type === PromotionType.PERCENTAGE) {
      const discount = subtotal * (Number(promo.discountValue) / 100);
      return promo.maxDiscount
        ? Math.min(discount, Number(promo.maxDiscount))
        : discount;
    }
    if (promo.type === PromotionType.FIXED_AMOUNT) {
      return Math.min(Number(promo.discountValue), subtotal);
    }
    return 0;
  }

  private calcShippingFee(provider: string, subtotal: number): number {
    if (subtotal >= 300000) return 0;    // Miễn phí ship đơn > 300k
    const fees: Record<string, number> = {
      ghn: 30000, ghtk: 15000, viettel_post: 10000, manual: 0,
    };
    return fees[provider] ?? 30000;
  }

  private validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]:          [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]:        [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]:       [OrderStatus.PACKED],
      [OrderStatus.PACKED]:           [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]:          [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]:        [OrderStatus.REFUND_REQUESTED],
      [OrderStatus.CANCELLED]:        [],
      [OrderStatus.REFUND_REQUESTED]: [OrderStatus.REFUNDED, OrderStatus.DELIVERED],
      [OrderStatus.REFUNDED]:         [],
    };
    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${current} → ${next}`,
      );
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count  = await this.orderRepo.count();
    const seq    = String(count + 1).padStart(4, '0');
    return `ORD-${date}-${seq}`;
  }
}