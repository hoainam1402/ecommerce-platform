import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum PointTransactionReason {
  ORDER_EARN      = 'order_earn',       // mua hàng
  ORDER_REFUND    = 'order_refund',     // hoàn đơn
  ORDER_REDEEM    = 'order_redeem',     // dùng điểm để mua
  REGISTER_BONUS  = 'register_bonus',   // thưởng đăng ký
  BIRTHDAY_BONUS  = 'birthday_bonus',   // thưởng sinh nhật
  ADMIN_ADJUST    = 'admin_adjust',     // admin điều chỉnh thủ công
  EXPIRE          = 'expire',           // điểm hết hạn
}

@Entity('loyalty_point_transactions')
export class LoyaltyPointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  points: number;              // dương = cộng, âm = trừ

  @Column({ name: 'balance_after' })
  balanceAfter: number;        // số dư sau giao dịch

  @Column({
    type: 'enum',
    enum: PointTransactionReason,
  })
  reason: PointTransactionReason;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;         // order_id hoặc promotion_id

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string;       // 'order' | 'promotion'

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
