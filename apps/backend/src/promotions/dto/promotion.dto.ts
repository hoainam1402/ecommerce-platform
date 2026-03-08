import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber, IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { PromotionStatus, PromotionType } from '../promotion.entity';

export class CreatePromotionDto {
  @ApiPropertyOptional({ example: 'SALE10', description: 'NULL = auto-apply' })
  @IsOptional() @IsString() @MaxLength(50)
  code?: string;

  @ApiProperty({ example: 'Giảm 10% toàn bộ đơn hàng' })
  @IsString() @MinLength(3) @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ enum: PromotionType })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ example: 10, description: '% hoặc số tiền cố định (VND)' })
  @IsNumber() @Min(0)
  @Type(() => Number)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Giảm tối đa (cho loại percentage)' })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Giá trị đơn tối thiểu' })
  @IsOptional() @IsNumber() @Min(0)
  @Type(() => Number)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Tổng lượt dùng tối đa (null = không giới hạn)' })
  @IsOptional() @IsInt() @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(1)
  @Type(() => Number)
  usagePerUser?: number = 1;

  @ApiProperty({ example: '2026-03-08T00:00:00Z' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59Z' })
  @IsOptional() @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ type: [String], description: 'UUID[] sản phẩm áp dụng (null = tất cả)' })
  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  applicableProducts?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  applicableCategories?: string[];
}

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  @ApiPropertyOptional({ enum: PromotionStatus })
  @IsOptional() @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}

export class ValidatePromotionDto {
  @ApiProperty({ example: 'SALE10' })
  @IsString()
  code: string;

  @ApiProperty({ example: 500000 })
  @IsNumber() @Min(0)
  @Type(() => Number)
  orderAmount: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  productIds?: string[];
}

export class QueryPromotionDto {
  @ApiPropertyOptional({ enum: PromotionStatus })
  @IsOptional() @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @ApiPropertyOptional({ enum: PromotionType })
  @IsOptional() @IsEnum(PromotionType)
  type?: PromotionType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}