import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { Promotion, PromotionStatus, PromotionType } from './promotion.entity';
import { PromotionUsage } from './promotion-usage.entity';
import {
  CreatePromotionDto, UpdatePromotionDto,
  ValidatePromotionDto, QueryPromotionDto,
} from './dto/promotion.dto';

export interface ValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
  promotion?: Promotion;
}

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
    @InjectRepository(PromotionUsage)
    private readonly usageRepo: Repository<PromotionUsage>,
  ) {}

  // ─── [Admin] Tạo promotion ────────────────────────────────
  async create(dto: CreatePromotionDto, createdBy: string): Promise<Promotion> {
    // Kiểm tra code trùng
    if (dto.code) {
      const exists = await this.promoRepo.findOne({ where: { code: dto.code } });
      if (exists) throw new ConflictException(`Mã "${dto.code}" đã tồn tại`);
    }

    // Validate discount value
    if (dto.type === PromotionType.PERCENTAGE && dto.discountValue > 100) {
      throw new BadRequestException('Phần trăm giảm không được vượt quá 100%');
    }

    const promo = this.promoRepo.create({
      ...dto,
      startsAt:  new Date(dto.startsAt),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      status:    PromotionStatus.DRAFT,
      createdBy,
    });

    return this.promoRepo.save(promo);
  }

  // ─── [Admin] Cập nhật ────────────────────────────────────
  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const promo = await this.findById(id);

    // Không cho sửa code khi đã active
    if (dto.code && dto.code !== promo.code && promo.status === PromotionStatus.ACTIVE) {
      throw new BadRequestException('Không thể đổi mã khi khuyến mãi đang chạy');
    }

    Object.assign(promo, {
      ...dto,
      startsAt:  dto.startsAt  ? new Date(dto.startsAt)  : promo.startsAt,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : promo.expiresAt,
    });

    return this.promoRepo.save(promo);
  }

  // ─── [Admin] Xóa (soft delete) ───────────────────────────
  async remove(id: string): Promise<void> {
    const promo = await this.findById(id);
    if (promo.status === PromotionStatus.ACTIVE) {
      throw new BadRequestException('Vui lòng tắt khuyến mãi trước khi xóa');
    }
    await this.promoRepo.softDelete(id);
  }

  // ─── [Admin] Danh sách ────────────────────────────────────
  async findAll(query: QueryPromotionDto): Promise<{ data: Promotion[]; total: number }> {
    const { page = 1, limit = 20, status, type } = query;

    const qb = this.promoRepo.createQueryBuilder('p')
      .withDeleted()
      .where('p.deleted_at IS NULL');

    if (status) qb.andWhere('p.status = :status', { status });
    if (type)   qb.andWhere('p.type = :type', { type });

    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  // ─── Chi tiết ─────────────────────────────────────────────
  async findById(id: string): Promise<Promotion> {
    const promo = await this.promoRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Khuyến mãi không tồn tại');
    return promo;
  }

  // ─── Flash sales đang chạy (public) ──────────────────────
  async getActiveFlashSales(): Promise<Promotion[]> {
    const now = new Date();
    return this.promoRepo.find({
      where: {
        status:   PromotionStatus.ACTIVE,
        type:     PromotionType.FREE_SHIPPING,  // hoặc lọc theo tag flash sale
      },
      order: { expiresAt: 'ASC' },
    });
  }

  // ─── Lấy tất cả promotion đang active (public) ───────────
  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    const promos = await this.promoRepo.find({
      where: { status: PromotionStatus.ACTIVE },
    });
    // Lọc thêm theo thời gian
    return promos.filter(p =>
      p.startsAt <= now && (!p.expiresAt || p.expiresAt >= now),
    );
  }

  // ─── Validate mã giảm giá ─────────────────────────────────
  async validate(dto: ValidatePromotionDto, userId?: string): Promise<ValidationResult> {
    const promo = await this.promoRepo.findOne({ where: { code: dto.code } });

    if (!promo) {
      return { isValid: false, discountAmount: 0, message: 'Mã giảm giá không tồn tại' };
    }

    const now = new Date();

    if (promo.status !== PromotionStatus.ACTIVE) {
      return { isValid: false, discountAmount: 0, message: 'Mã giảm giá không còn hiệu lực' };
    }
    if (promo.startsAt > now) {
      return { isValid: false, discountAmount: 0, message: 'Mã chưa có hiệu lực' };
    }
    if (promo.expiresAt && promo.expiresAt < now) {
      return { isValid: false, discountAmount: 0, message: 'Mã giảm giá đã hết hạn' };
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return { isValid: false, discountAmount: 0, message: 'Mã đã hết lượt sử dụng' };
    }
    if (promo.minOrderValue && dto.orderAmount < Number(promo.minOrderValue)) {
      return {
        isValid: false, discountAmount: 0,
        message: `Đơn hàng tối thiểu ${Number(promo.minOrderValue).toLocaleString('vi-VN')}đ`,
      };
    }

    // Kiểm tra user đã dùng chưa
    if (userId && promo.usagePerUser > 0) {
      const userUsage = await this.usageRepo.count({
        where: { promotionId: promo.id, userId },
      });
      if (userUsage >= promo.usagePerUser) {
        return { isValid: false, discountAmount: 0, message: 'Bạn đã dùng hết lượt cho mã này' };
      }
    }

    // Kiểm tra sản phẩm áp dụng
    if (promo.applicableProducts?.length && dto.productIds?.length) {
      const hasApplicable = dto.productIds.some(id =>
        promo.applicableProducts.includes(id),
      );
      if (!hasApplicable) {
        return {
          isValid: false, discountAmount: 0,
          message: 'Mã không áp dụng cho sản phẩm trong giỏ hàng',
        };
      }
    }

    const discountAmount = this.calcDiscount(promo, dto.orderAmount);

    return {
      isValid: true,
      discountAmount,
      message: `Áp dụng thành công! Giảm ${discountAmount.toLocaleString('vi-VN')}đ`,
      promotion: promo,
    };
  }

  // ─── Ghi nhận lượt sử dụng (gọi sau khi tạo order) ──────
  async recordUsage(
    promotionId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
  ): Promise<void> {
    await this.usageRepo.save(
      this.usageRepo.create({ promotionId, userId, orderId, discountAmount }),
    );
    await this.promoRepo.increment({ id: promotionId }, 'usedCount', 1);
  }

  // ─── Tự động expired promotion quá hạn ──────────────────
  async expireOutdated(): Promise<number> {
    const now = new Date();
    const result = await this.promoRepo
      .createQueryBuilder()
      .update(Promotion)
      .set({ status: PromotionStatus.EXPIRED })
      .where('status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere('expires_at IS NOT NULL')
      .andWhere('expires_at < :now', { now })
      .execute();

    const count = result.affected ?? 0;
    if (count > 0) this.logger.log(`Expired ${count} outdated promotions`);
    return count;
  }

  // ─── Helpers ──────────────────────────────────────────────
  calcDiscount(promo: Promotion, orderAmount: number): number {
    if (promo.type === PromotionType.PERCENTAGE) {
      const discount = orderAmount * (Number(promo.discountValue) / 100);
      return promo.maxDiscount
        ? Math.min(discount, Number(promo.maxDiscount))
        : Math.round(discount);
    }
    if (promo.type === PromotionType.FIXED_AMOUNT) {
      return Math.min(Number(promo.discountValue), orderAmount);
    }
    if (promo.type === PromotionType.FREE_SHIPPING) {
      return 0; // shipping fee handled separately
    }
    return 0;
  }

  // ─── Thống kê usage của 1 promotion ──────────────────────
  async getUsageStats(promotionId: string): Promise<{
    totalUsed: number;
    totalDiscount: number;
    recentUsages: PromotionUsage[];
  }> {
    await this.findById(promotionId);

    const usages = await this.usageRepo.find({
      where: { promotionId },
      relations: ['user', 'order'],
      order: { usedAt: 'DESC' },
      take: 20,
    });

    const totalDiscount = usages.reduce(
      (sum, u) => sum + Number(u.discountAmount), 0,
    );

    return {
      totalUsed:    usages.length,
      totalDiscount,
      recentUsages: usages,
    };
  }
}
