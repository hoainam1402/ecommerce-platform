import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { User } from '../../users/entities/user.entity';

export enum InventoryReason {
  SALE        = 'sale',
  RETURN      = 'return',
  RESTOCK     = 'restock',
  ADJUSTMENT  = 'adjustment',
  RESERVED    = 'reserved',
  UNRESERVED  = 'unreserved',
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'quantity_change' })
  quantityChange: number;   // dương = nhập, âm = xuất

  @Column({ name: 'quantity_after' })
  quantityAfter: number;

  @Column({ type: 'enum', enum: InventoryReason })
  reason: InventoryReason;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
