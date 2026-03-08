import { IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DateRangePreset {
  TODAY      = 'today',
  YESTERDAY  = 'yesterday',
  LAST_7     = 'last_7',
  LAST_30    = 'last_30',
  LAST_90    = 'last_90',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR  = 'this_year',
  CUSTOM     = 'custom',
}

export enum GroupBy {
  DAY   = 'day',
  WEEK  = 'week',
  MONTH = 'month',
}

export class DateRangeDto {
  @ApiPropertyOptional({ enum: DateRangePreset, default: DateRangePreset.LAST_30 })
  @IsOptional() @IsEnum(DateRangePreset)
  preset?: DateRangePreset = DateRangePreset.LAST_30;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional() @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional() @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: GroupBy, default: GroupBy.DAY })
  @IsOptional() @IsEnum(GroupBy)
  groupBy?: GroupBy = GroupBy.DAY;
}

export class TopProductsDto extends DateRangeDto {
  @ApiPropertyOptional({ default: 10 })
  @IsOptional() @IsInt() @Min(1) @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}

// ── Response interfaces ────────────────────────────────────────
export interface DashboardSummary {
  revenue:          MetricWithChange;
  orders:           MetricWithChange;
  newCustomers:     MetricWithChange;
  avgOrderValue:    MetricWithChange;
  conversionRate:   MetricWithChange;
  pendingOrders:    number;
  processingOrders: number;
  lowStockProducts: number;
}

export interface MetricWithChange {
  value:      number;
  prevValue:  number;
  change:     number;   // %
  trend:      'up' | 'down' | 'flat';
}

export interface RevenueChartPoint {
  date:       string;
  revenue:    number;
  orders:     number;
  avgOrder:   number;
}

export interface TopProduct {
  id:           string;
  name:         string;
  slug:         string;
  image:        string | null;
  soldCount:    number;
  revenue:      number;
  avgRating:    number;
}

export interface OrderStatusBreakdown {
  status: string;
  count:  number;
  pct:    number;
}

export interface CustomerStats {
  total:        number;
  newThisPeriod: number;
  returning:    number;
  topSpenders:  TopSpender[];
  retentionRate: number;
}

export interface TopSpender {
  userId:    string;
  fullName:  string;
  email:     string;
  totalSpent: number;
  orderCount: number;
}

export interface PaymentMethodBreakdown {
  method:  string;
  count:   number;
  revenue: number;
  pct:     number;
}

export interface InventoryAlert {
  productId:   string;
  productName: string;
  variantId:   string;
  variantName: string;
  sku:         string;
  stock:       number;
  threshold:   number;
}
