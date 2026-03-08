import {
  IsString, IsOptional, IsNumber, IsBoolean, IsEnum,
  IsArray, IsUUID, Min, MaxLength, IsObject, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../entities/product.entity';

// ─── Category DTOs ────────────────────────────────────────────
export class CreateCategoryDto {
  @ApiProperty({ example: 'Điện thoại' })
  @IsString() @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'dien-thoai' })
  @IsString() @MaxLength(255)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  metaDescription?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {}

// ─── Brand DTOs ───────────────────────────────────────────────
export class CreateBrandDto {
  @ApiProperty({ example: 'Apple' })
  @IsString() @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'apple' })
  @IsString() @MaxLength(255)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateBrandDto extends CreateBrandDto {}

// ─── Variant DTO ──────────────────────────────────────────────
export class CreateVariantDto {
  @ApiProperty({ example: 'SP001-RED-XL' })
  @IsOptional() @IsString() @MaxLength(100)
  sku?: string;

  @ApiProperty({ example: 'Đỏ / XL' })
  @IsString() @MaxLength(255)
  name: string;

  @ApiProperty({ example: { color: 'Đỏ', size: 'XL' } })
  @IsObject()
  attributes: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsNumber() @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  weight?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsNumber()
  sortOrder?: number;
}

// ─── Product DTOs ─────────────────────────────────────────────
export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max 256GB' })
  @IsString() @MaxLength(500)
  name: string;

  @ApiProperty({ example: 'iphone-15-pro-max-256gb' })
  @IsString() @MaxLength(500)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Mảng category UUIDs' })
  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ example: 29990000 })
  @IsNumber() @Min(0)
  basePrice: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  weight?: number;

  @ApiPropertyOptional({ example: { length: 15, width: 7, height: 0.8 } })
  @IsOptional() @IsObject()
  dimensions?: { length: number; width: number; height: number };

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional() @IsObject()
  attributes?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class UpdateProductDto extends CreateProductDto {}

// ─── Query / Filter DTOs ──────────────────────────────────────
export class ProductQueryDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsNumber() @Min(1)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'newest', 'best_seller', 'top_rated'] })
  @IsOptional() @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsNumber() @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsNumber() @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

// ─── Inventory ────────────────────────────────────────────────
export class AdjustStockDto {
  @ApiProperty({ description: 'Dương = nhập kho, Âm = xuất kho' })
  @IsNumber()
  quantityChange: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}
