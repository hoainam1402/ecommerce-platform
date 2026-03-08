import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LoyaltyTier {
  BRONZE   = 'bronze',
  SILVER   = 'silver',
  GOLD     = 'gold',
  PLATINUM = 'platinum',
}

// Ngưỡng điểm để lên tier
export const TIER_THRESHOLDS = {
  [LoyaltyTier.BRONZE]:   0,
  [LoyaltyTier.SILVER]:   1000,
  [LoyaltyTier.GOLD]:     5000,
  [LoyaltyTier.PLATINUM]: 20000,
};

@Entity('user_loyalty_points')
export class UserLoyaltyPoints {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 0 })
  points: number;              // điểm hiện có (có thể dùng)

  @Column({
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
  })
  tier: LoyaltyTier;

  @Column({ name: 'total_earned', default: 0 })
  totalEarned: number;         // tổng điểm đã kiếm (dùng để tính tier)

  @Column({ name: 'total_spent', default: 0 })
  totalSpent: number;          // tổng điểm đã tiêu

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
