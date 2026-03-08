import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Promotion } from './promotion.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Entity('promotion_usages')
export class PromotionUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'promotion_id' })
  promotionId: string;

  @ManyToOne(() => Promotion)
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2 })
  discountAmount: number;

  @CreateDateColumn({ name: 'used_at', type: 'timestamptz' })
  usedAt: Date;
}
