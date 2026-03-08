import {
  Controller, Get, Query, DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { DateRangeDto, TopProductsDto } from './dto/analytics.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('admin', 'super_admin', 'operator', 'viewer')
  @ApiOperation({ summary: '[Admin] Dashboard tổng quan — KPIs + so sánh kỳ trước' })
  getDashboard(@Query() dto: DateRangeDto) {
    return this.analyticsService.getDashboardSummary(dto);
  }

  @Get('revenue-chart')
  @Roles('admin', 'super_admin', 'operator', 'viewer')
  @ApiOperation({ summary: '[Admin] Biểu đồ doanh thu theo thời gian' })
  getRevenueChart(@Query() dto: DateRangeDto) {
    return this.analyticsService.getRevenueChart(dto);
  }

  @Get('top-products')
  @Roles('admin', 'super_admin', 'operator', 'viewer')
  @ApiOperation({ summary: '[Admin] Top sản phẩm bán chạy' })
  getTopProducts(@Query() dto: TopProductsDto) {
    return this.analyticsService.getTopProducts(dto);
  }

  @Get('order-status')
  @Roles('admin', 'super_admin', 'operator', 'viewer')
  @ApiOperation({ summary: '[Admin] Phân bổ trạng thái đơn hàng' })
  getOrderStatus(@Query() dto: DateRangeDto) {
    return this.analyticsService.getOrderStatusBreakdown(dto);
  }

  @Get('customers')
  @Roles('admin', 'super_admin', 'operator', 'viewer')
  @ApiOperation({ summary: '[Admin] Thống kê khách hàng + top spenders' })
  getCustomers(@Query() dto: TopProductsDto) {
    return this.analyticsService.getCustomerStats(dto);
  }

  @Get('payment-methods')
  @Roles('admin', 'super_admin', 'operator', 'viewer')
  @ApiOperation({ summary: '[Admin] Phân bổ phương thức thanh toán' })
  getPaymentMethods(@Query() dto: DateRangeDto) {
    return this.analyticsService.getPaymentBreakdown(dto);
  }

  @Get('low-stock')
  @Roles('admin', 'super_admin', 'operator')
  @ApiOperation({ summary: '[Admin] Cảnh báo sản phẩm sắp hết hàng' })
  @ApiQuery({ name: 'threshold', required: false, description: 'Ngưỡng tồn kho (default: 5)' })
  getLowStock(
    @Query('threshold', new DefaultValuePipe(5), ParseIntPipe) threshold: number,
  ) {
    return this.analyticsService.getLowStockAlerts(threshold);
  }
}
