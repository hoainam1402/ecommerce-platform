import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum PaymentMethod {
  VNPAY   = 'vnpay',
  MOMO    = 'momo',
  ZALOPAY = 'zalopay',
  STRIPE  = 'stripe',
  COD     = 'cod',
  BANKING = 'banking',
  WALLET  = 'wallet',
}

export enum PaymentStatus {
  PENDING             = 'pending',
  PAID                = 'paid',
  FAILED              = 'failed',
  REFUNDED            = 'refunded',
  PARTIALLY_REFUNDED  = 'partially_refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.payments)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'VND' })
  currency: string;

  // ── Gateway response ─────────────────────────────────────
  @Column({ name: 'gateway_transaction_id', length: 255, nullable: true })
  gatewayTransactionId: string;

  @Column({ name: 'gateway_response', type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, any>;

  @Column({ name: 'gateway_paid_at', type: 'timestamptz', nullable: true })
  gatewayPaidAt: Date;

  // ── Refund ───────────────────────────────────────────────
  @Column({ name: 'refund_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date;

  @Column({ name: 'refund_reason', type: 'text', nullable: true })
  refundReason: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  // ── URL thanh toán (lưu để retry) ───────────────────────
  @Column({ name: 'payment_url', type: 'text', nullable: true })
  paymentUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
