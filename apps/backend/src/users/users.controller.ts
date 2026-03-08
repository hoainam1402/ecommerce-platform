import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AddressService } from './address.service';
import { LoyaltyService } from './loyalty.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/guards/auth.guard';
import { User, Gender, UserRole } from './entities/user.entity';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AdjustPointsDto,
} from './dto/address-loyalty.dto';

class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional() @IsString() fullName?: string;
  @ApiPropertyOptional()
  @IsOptional() @IsString() avatarUrl?: string;
  @ApiPropertyOptional({ enum: Gender })
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional() @IsDateString() dateOfBirth?: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly addressService: AddressService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy profile hiện tại' })
  getMe(@CurrentUser() user: User) { return user; }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật profile' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto as Partial<User>);
  }

  // ── Addresses ──────────────────────────────────────────────
  @Get('me/addresses')
  @ApiOperation({ summary: 'Danh sách địa chỉ giao hàng' })
  getAddresses(@CurrentUser() user: User) {
    return this.addressService.findAll(user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ mới' })
  createAddress(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.id, dto);
  }

  @Put('me/addresses/:id')
  @ApiOperation({ summary: 'Cập nhật địa chỉ' })
  @ApiParam({ name: 'id', type: 'string' })
  updateAddress(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.update(id, user.id, dto);
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  @ApiParam({ name: 'id', type: 'string' })
  removeAddress(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressService.remove(id, user.id);
  }

  @Patch('me/addresses/:id/default')
  @ApiOperation({ summary: 'Đặt làm địa chỉ mặc định' })
  @ApiParam({ name: 'id', type: 'string' })
  setDefaultAddress(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.addressService.setDefault(id, user.id);
  }

  // ── Loyalty ────────────────────────────────────────────────
  @Get('me/loyalty')
  @ApiOperation({ summary: 'Thông tin điểm & hạng thành viên' })
  getLoyalty(@CurrentUser() user: User) {
    return this.loyaltyService.getLoyalty(user.id);
  }

  @Get('me/loyalty/history')
  @ApiOperation({ summary: 'Lịch sử giao dịch điểm' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLoyaltyHistory(@CurrentUser() user: User, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.loyaltyService.getHistory(user.id, +page, +limit);
  }

  // ── Admin ──────────────────────────────────────────────────
  @Post(':userId/loyalty/adjust')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Điều chỉnh điểm thủ công' })
  @ApiParam({ name: 'userId', type: 'string' })
  adminAdjustPoints(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: AdjustPointsDto) {
    return this.loyaltyService.adminAdjust(userId, dto);
  }
}
