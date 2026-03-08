import {
  IsString, IsOptional, IsBoolean, IsPhoneNumber,
  MaxLength, IsNumber, Min, Max, IsEnum, IsUUID, IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PointTransactionReason } from '../entities/loyalty-point-transaction.entity';

// ─── Address DTOs ─────────────────────────────────────────────
export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Nhà' })
  @IsOptional() @IsString() @MaxLength(50)
  label?: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString() @MaxLength(255)
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString() @MaxLength(20)
  recipientPhone: string;

  @ApiProperty({ example: 'Hồ Chí Minh' })
  @IsString() @MaxLength(100)
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsString() @MaxLength(100)
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsString() @MaxLength(100)
  ward: string;

  @ApiProperty({ example: '123 Đường Lê Lợi' })
  @IsString()
  streetAddress: string;

  @ApiPropertyOptional({ example: '70000' })
  @IsOptional() @IsString() @MaxLength(10)
  postalCode?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 10.7769 })
  @IsOptional() @IsNumber() @Min(-90) @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 106.7009 })
  @IsOptional() @IsNumber() @Min(-180) @Max(180)
  longitude?: number;
}

export class UpdateAddressDto extends CreateAddressDto {}

export class SetDefaultAddressDto {
  @ApiProperty()
  @IsUUID()
  addressId: string;
}

// ─── Loyalty DTOs ─────────────────────────────────────────────
export class AdjustPointsDto {
  @ApiProperty({ example: 100, description: 'Dương = cộng điểm, Âm = trừ điểm' })
  @IsNumber()
  points: number;

  @ApiProperty({ enum: PointTransactionReason })
  @IsEnum(PointTransactionReason)
  reason: PointTransactionReason;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  referenceType?: string;
}

export class RedeemPointsDto {
  @ApiProperty({ example: 50, description: 'Số điểm muốn dùng' })
  @IsNumber() @IsPositive()
  points: number;
}
