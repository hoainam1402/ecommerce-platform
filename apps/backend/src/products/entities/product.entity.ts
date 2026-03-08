import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

export enum ProductStatus {
  DRAFT        = 'draft',
  ACTIVE       = 'active',
  INACTIVE     = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId: string;

  @ManyToOne(() => Brand, (b) => b.products, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'product_categories',
    joinColumn:        { name: 'product_id',  referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => ProductVariant, (v) => v.product, { cascade: true })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images: ProductImage[];

  @Column({ length: 100, unique: true, nullable: true })
  sku: string;

  @Column({ length: 500 })
  name: string;

  @Column({ length: 500, unique: true })
  slug: string;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
  basePrice: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  salePrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;                // kg

  @Column({ type: 'jsonb', nullable: true })
  dimensions: { length: number; width: number; height: number };

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'sold_count', default: 0 })
  soldCount: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];

  @Column({ name: 'meta_title', length: 255, nullable: true })
  metaTitle: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, any>;    // flexible attributes

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date;

  // Virtual — giá hiển thị (sale hoặc base)
  get displayPrice(): number {
    return this.salePrice ?? this.basePrice;
  }

  get discountPercent(): number | null {
    if (!this.salePrice || this.salePrice >= this.basePrice) return null;
    return Math.round((1 - this.salePrice / this.basePrice) * 100);
  }
}
