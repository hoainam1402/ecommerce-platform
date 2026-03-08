import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, DeleteDateColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum PromotionType {
  PERCENTAGE   = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y  = 'buy_x_get_y',
}

export enum PromotionStatus {
  DRAFT    = 'draft',
  ACTIVE   = 'active',
  EXPIRED  = 'expired',
  DISABLED = 'disabled',
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, nullable: true })
  code: string;           // NULL = auto-apply

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ type: 'enum', enum: PromotionStatus, default: PromotionStatus.DRAFT })
  status: PromotionStatus;

  @Column({ name: 'discount_value', type: 'decimal', precision: 15, scale: 2 })
  discountValue: number;  // % hoặc số tiền cố định

  @Column({ name: 'max_discount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxDiscount: number;    // cap cho percentage type

  @Column({ name: 'min_order_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  minOrderValue: number;

  @Column({ name: 'usage_limit', nullable: true })
  usageLimit: number;     // NULL = unlimited

  @Column({ name: 'usage_per_user', default: 1 })
  usagePerUser: number;

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'applicable_products', type: 'uuid', array: true, nullable: true })
  applicableProducts: string[];

  @Column({ name: 'applicable_categories', type: 'uuid', array: true, nullable: true })
  applicableCategories: string[];

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date;
}
