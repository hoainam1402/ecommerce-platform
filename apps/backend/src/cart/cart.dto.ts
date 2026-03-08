import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  variantId?: string;

  @ApiProperty({ default: 1 })
  @IsInt() @Min(1)
  @Type(() => Number)
  quantity: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: '0 = xóa item' })
  @IsInt() @Min(0)
  @Type(() => Number)
  quantity: number;
}

export class ApplyPromotionDto {
  @ApiProperty({ example: 'SALE10' })
  @IsString()
  code: string;
}

export class CalcShippingFeeDto {
  @ApiProperty()
  @IsUUID()
  addressId: string;

  @ApiProperty({ enum: ['ghn', 'ghtk', 'viettel_post'] })
  @IsString()
  provider: string;
}
