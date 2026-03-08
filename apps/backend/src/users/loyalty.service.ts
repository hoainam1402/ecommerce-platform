import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserLoyaltyPoints,
  LoyaltyTier,
  TIER_THRESHOLDS,
} from './entities/user-loyalty-points.entity';
import {
  LoyaltyPointTransaction,
  PointTransactionReason,
} from './entities/loyalty-point-transaction.entity';
import { AdjustPointsDto } from './dto/address-loyalty.dto';

// Tỷ lệ quy đổi: 1 điểm = 1.000đ
export const POINT_TO_VND = 1000;
// Kiếm điểm: mỗi 100.000đ = 1 điểm
export const VND_PER_POINT_EARN = 100000;

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(UserLoyaltyPoints)
    private readonly loyaltyRepo: Repository<UserLoyaltyPoints>,
    @InjectRepository(LoyaltyPointTransaction)
    private readonly txRepo: Repository<LoyaltyPointTransaction>,
  ) {}

  // ─── Lấy thông tin loyalty ────────────────────────────────
  async getLoyalty(userId: string): Promise<UserLoyaltyPoints> {
    let loyalty = await this.loyaltyRepo.findOne({ where: { userId } });
    if (!loyalty) {
      // Tự tạo nếu chưa có (user cũ)
      loyalty = await this.initLoyalty(userId);
    }
    return loyalty;
  }

  // ─── Lịch sử giao dịch điểm ───────────────────────────────
  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: LoyaltyPointTransaction[]; total: number }> {
    const [data, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // ─── Cộng điểm (khi mua hàng) ─────────────────────────────
  async earnPoints(
    userId: string,
    orderAmount: number,
    orderId: string,
  ): Promise<UserLoyaltyPoints> {
    const points = Math.floor(orderAmount / VND_PER_POINT_EARN);
    if (points <= 0) return this.getLoyalty(userId);

    return this.adjust(userId, {
      points,
      reason: PointTransactionReason.ORDER_EARN,
      referenceId: orderId,
      referenceType: 'order',
      note: `Tích điểm đơn hàng ${orderAmount.toLocaleString()}đ`,
    });
  }

  // ─── Trừ điểm (khi dùng điểm mua hàng) ───────────────────
  async redeemPoints(
    userId: string,
    points: number,
    orderId: string,
  ): Promise<{ loyalty: UserLoyaltyPoints; discountAmount: number }> {
    const loyalty = await this.getLoyalty(userId);

    if (points > loyalty.points) {
      throw new BadRequestException(
        `Không đủ điểm. Hiện có: ${loyalty.points}, cần: ${points}`,
      );
    }

    const discountAmount = points * POINT_TO_VND;
    const updated = await this.adjust(userId, {
      points: -points,
      reason: PointTransactionReason.ORDER_REDEEM,
      referenceId: orderId,
      referenceType: 'order',
      note: `Dùng ${points} điểm = ${discountAmount.toLocaleString()}đ`,
    });

    return { loyalty: updated, discountAmount };
  }

  // ─── Hoàn điểm (khi hủy đơn) ──────────────────────────────
  async refundPoints(
    userId: string,
    points: number,
    orderId: string,
  ): Promise<UserLoyaltyPoints> {
    if (points <= 0) return this.getLoyalty(userId);
    return this.adjust(userId, {
      points,
      reason: PointTransactionReason.ORDER_REFUND,
      referenceId: orderId,
      referenceType: 'order',
      note: `Hoàn điểm đơn hàng bị hủy`,
    });
  }

  // ─── Thưởng đăng ký ───────────────────────────────────────
  async giveRegisterBonus(userId: string): Promise<void> {
    const REGISTER_BONUS = 50;
    await this.adjust(userId, {
      points: REGISTER_BONUS,
      reason: PointTransactionReason.REGISTER_BONUS,
      note: 'Thưởng đăng ký tài khoản mới',
    });
  }

  // ─── Admin điều chỉnh thủ công ────────────────────────────
  async adminAdjust(userId: string, dto: AdjustPointsDto): Promise<UserLoyaltyPoints> {
    const loyalty = await this.getLoyalty(userId);
    if (dto.points < 0 && Math.abs(dto.points) > loyalty.points) {
      throw new BadRequestException('Không thể trừ nhiều hơn số điểm hiện có');
    }
    return this.adjust(userId, dto);
  }

  // ─── Tính điểm tương đương tiền ───────────────────────────
  calcMaxRedeemable(points: number, orderAmount: number): number {
    // Tối đa dùng điểm cho 30% giá trị đơn hàng
    const maxFromOrder = Math.floor(orderAmount * 0.3 / POINT_TO_VND);
    return Math.min(points, maxFromOrder);
  }

  // ─── Internal: khởi tạo loyalty record ────────────────────
  async initLoyalty(userId: string): Promise<UserLoyaltyPoints> {
    const existing = await this.loyaltyRepo.findOne({ where: { userId } });
    if (existing) return existing;
    const loyalty = this.loyaltyRepo.create({ userId });
    return this.loyaltyRepo.save(loyalty);
  }

  // ─── Internal: điều chỉnh điểm + ghi transaction ──────────
  private async adjust(
    userId: string,
    dto: {
      points: number;
      reason: PointTransactionReason;
      referenceId?: string;
      referenceType?: string;
      note?: string;
    },
  ): Promise<UserLoyaltyPoints> {
    const loyalty = await this.getLoyalty(userId);

    loyalty.points += dto.points;
    if (dto.points > 0) loyalty.totalEarned += dto.points;
    else loyalty.totalSpent += Math.abs(dto.points);

    // Cập nhật tier
    loyalty.tier = this.calcTier(loyalty.totalEarned);

    await this.loyaltyRepo.save(loyalty);

    // Ghi transaction log
    const tx = this.txRepo.create({
      userId,
      points: dto.points,
      balanceAfter: loyalty.points,
      reason: dto.reason,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      note: dto.note,
    });
    await this.txRepo.save(tx);

    return loyalty;
  }

  // ─── Internal: tính tier dựa trên tổng điểm đã kiếm ──────
  private calcTier(totalEarned: number): LoyaltyTier {
    if (totalEarned >= TIER_THRESHOLDS[LoyaltyTier.PLATINUM]) return LoyaltyTier.PLATINUM;
    if (totalEarned >= TIER_THRESHOLDS[LoyaltyTier.GOLD])     return LoyaltyTier.GOLD;
    if (totalEarned >= TIER_THRESHOLDS[LoyaltyTier.SILVER])   return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }
}
