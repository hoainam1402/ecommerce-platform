import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum ShipmentStatus {
  PENDING    = 'pending',
  PICKED_UP  = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED  = 'delivered',
  FAILED     = 'failed',
  RETURNED   = 'returned',
}

export enum ShippingProvider {
  GHN          = 'ghn',
  GHTK         = 'ghtk',
  VIETTEL_POST = 'viettel_post',
  MANUAL       = 'manual',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.shipments)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: ShippingProvider })
  provider: ShippingProvider;

  @Column({ name: 'tracking_number', length: 100, nullable: true })
  trackingNumber: string;

  @Column({ name: 'tracking_url', type: 'text', nullable: true })
  trackingUrl: string;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ name: 'estimated_delivery', type: 'date', nullable: true })
  estimatedDelivery: Date;

  @Column({ name: 'actual_delivery', type: 'timestamptz', nullable: true })
  actualDelivery: Date;

  @Column({ name: 'weight', type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @Column({ name: 'cod_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  codAmount: number;

  @Column({ name: 'shipping_fee', type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ name: 'provider_order_code', length: 100, nullable: true })
  providerOrderCode: string;

  @Column({ name: 'provider_response', type: 'jsonb', nullable: true })
  providerResponse: Record<string, any>;

  @OneToMany(() => ShipmentEvent, (e) => e.shipment, { cascade: true })
  events: ShipmentEvent[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity('shipment_events')
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @ManyToOne(() => Shipment, (s) => s.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({ length: 100 })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;
}
