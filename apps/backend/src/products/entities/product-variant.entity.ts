import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => ProductImage, (img) => img.variant)
  images: ProductImage[];

  @Column({ length: 100, unique: true, nullable: true })
  sku: string;

  @Column({ length: 255 })
  name: string;            // e.g. "Đỏ / XL"

  @Column({ type: 'jsonb' })
  attributes: Record<string, string>;   // { color: 'Đỏ', size: 'XL' }

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price: number;           // null = dùng product.basePrice

  @Column({ name: 'sale_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  salePrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costPrice: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'reserved_qty', default: 0 })
  reservedQty: number;     // đang trong đơn chờ xử lý

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Virtual
  get availableQty(): number {
    return Math.max(0, this.stockQuantity - this.reservedQty);
  }
}
