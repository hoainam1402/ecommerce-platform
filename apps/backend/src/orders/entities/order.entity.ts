import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Shipment } from './shipment.entity';
import { Promotion } from '../../promotions/promotion.entity';

export enum OrderStatus {
  PENDING            = 'pending',
  CONFIRMED          = 'confirmed',
  PROCESSING         = 'processing',
  PACKED             = 'packed',
  SHIPPED            = 'shipped',
  DELIVERED          = 'delivered',
  CANCELLED          = 'cancelled',
  REFUND_REQUESTED   = 'refund_requested',
  REFUNDED           = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', length: 50, unique: true })
  orderNumber: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ── Snapshot địa chỉ giao hàng ──────────────────────────
  @Column({ name: 'shipping_name', length: 255 })
  shippingName: string;

  @Column({ name: 'shipping_phone', length: 20 })
  shippingPhone: string;

  @Column({ name: 'shipping_province', length: 100 })
  shippingProvince: string;

  @Column({ name: 'shipping_district', length: 100 })
  shippingDistrict: string;

  @Column({ name: 'shipping_ward', length: 100 })
  shippingWard: string;

  @Column({ name: 'shipping_address', type: 'text' })
  shippingAddress: string;

  // ── Trạng thái ──────────────────────────────────────────
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  // ── Giá tiền ────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal: number;

  @Column({ name: 'shipping_fee', type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ name: 'points_used', default: 0 })
  pointsUsed: number;

  @Column({ name: 'points_earned', default: 0 })
  pointsEarned: number;

  // ── Promotion ───────────────────────────────────────────
  @Column({ name: 'promotion_id', type: 'uuid', nullable: true })
  promotionId: string;

  @ManyToOne(() => Promotion, { nullable: true })
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @Column({ name: 'promotion_code', length: 50, nullable: true })
  promotionCode: string;

  // ── Relations ───────────────────────────────────────────
  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Payment, (p) => p.order)
  payments: Payment[];

  @OneToMany(() => Shipment, (s) => s.order)
  shipments: Shipment[];

  // ── Timestamps trạng thái ───────────────────────────────
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'packed_at', type: 'timestamptz', nullable: true })
  packedAt: Date;

  @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
  shippedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
