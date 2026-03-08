import {
  IsString, IsOptional, IsNumber, IsEnum,
  IsArray, IsUUID, IsInt, Min, Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SearchSortBy {
  RELEVANCE   = 'relevance',
  NEWEST      = 'newest',
  PRICE_ASC   = 'price_asc',
  PRICE_DESC  = 'price_desc',
  BEST_SELLER = 'best_seller',
  TOP_RATED   = 'top_rated',
}

export class SearchProductDto {
  @ApiPropertyOptional({ description: 'Từ khoá tìm kiếm' })
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

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional() @IsNumber() @Min(1) @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ type: [String], description: 'Filter tags' })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: SearchSortBy, default: SearchSortBy.RELEVANCE })
  @IsOptional() @IsEnum(SearchSortBy)
  sort?: SearchSortBy = SearchSortBy.RELEVANCE;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class AutocompleteDto {
  @ApiPropertyOptional()
  @IsString()
  q: string;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional() @IsInt() @Min(1) @Max(20)
  @Type(() => Number)
  limit?: number = 8;
}

export interface SearchResult {
  data: ProductDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  took: number;       // ms
  aggregations?: {
    brands: AggBucket[];
    categories: AggBucket[];
    priceRanges: AggBucket[];
  };
}

export interface AggBucket {
  key: string;
  label: string;
  count: number;
}

export interface ProductDocument {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  salePrice: number | null;
  brandId: string;
  brandName: string;
  categoryIds: string[];
  categoryNames: string[];
  tags: string[];
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  status: string;
  isFeatured: boolean;
  primaryImage: string | null;
  updatedAt: string;
}
