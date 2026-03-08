import {
  IsUUID, IsEnum, IsOptional, IsString,
  IsInt, Min, IsArray, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';
import { ShippingProvider } from '../entities/shipment.entity';
import { OrderStatus } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID địa chỉ giao hàng đã lưu' })
  @IsUUID()
  addressId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: ShippingProvider })
  @IsEnum(ShippingProvider)
  shippingProvider: ShippingProvider;

  @ApiPropertyOptional({ example: 'SALE10' })
  @IsOptional() @IsString()
  promotionCode?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0)
  @Type(() => Number)
  pointsToUse?: number = 0;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;
}

export class CancelOrderDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class ReturnItemDto {
  @ApiProperty()
  @IsUUID()
  orderItemId: string;

  @ApiProperty()
  @IsInt() @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  reason?: string;
}

export class CreateReturnDto {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray() @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
