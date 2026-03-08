import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/guards/auth.guard';
import { User } from '../users/entities/user.entity';
import {
  CreatePromotionDto, UpdatePromotionDto,
  ValidatePromotionDto, QueryPromotionDto,
} from './dto/promotion.dto';

// ── Public endpoints ──────────────────────────────────────────
@ApiTags('Promotions')
@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('validate')
  @Public()
  @ApiOperation({ summary: 'Kiểm tra mã giảm giá có hợp lệ không' })
  validate(@Body() dto: ValidatePromotionDto, @CurrentUser() user?: User) {
    return this.promotionService.validate(dto, user?.id);
  }

  @Get('flash-sales')
  @Public()
  @ApiOperation({ summary: 'Danh sách flash sale đang chạy' })
  getFlashSales() {
    return this.promotionService.getActiveFlashSales();
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Danh sách khuyến mãi đang active' })
  getActive() {
    return this.promotionService.getActivePromotions();
  }
}

// ── Admin endpoints ───────────────────────────────────────────
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/promotions')
export class AdminPromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @Roles('admin', 'super_admin', 'operator')
  @ApiOperation({ summary: '[Admin] Danh sách khuyến mãi' })
  findAll(@Query() query: QueryPromotionDto) {
    return this.promotionService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'super_admin', 'operator')
  @ApiOperation({ summary: '[Admin] Chi tiết khuyến mãi' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.findById(id);
  }

  @Get(':id/stats')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '[Admin] Thống kê sử dụng mã' })
  @ApiParam({ name: 'id', type: 'string' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.getUsageStats(id);
  }

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '[Admin] Tạo khuyến mãi mới' })
  create(@Body() dto: CreatePromotionDto, @CurrentUser() user: User) {
    return this.promotionService.create(dto, user.id);
  }

  @Put(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '[Admin] Cập nhật khuyến mãi' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '[Admin] Kích hoạt khuyến mãi' })
  @ApiParam({ name: 'id', type: 'string' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.update(id, { status: 'active' as any });
  }

  @Patch(':id/disable')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '[Admin] Tắt khuyến mãi' })
  @ApiParam({ name: 'id', type: 'string' })
  disable(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.update(id, { status: 'disabled' as any });
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xóa khuyến mãi' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionService.remove(id);
  }

  @Post('expire-outdated')
  @Roles('super_admin')
  @ApiOperation({ summary: '[Admin] Chạy thủ công job expire promotion quá hạn' })
  expireOutdated() {
    return this.promotionService.expireOutdated();
  }
}
