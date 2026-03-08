import {
  Controller, Get, Post, Patch, Body,
  Param, ParseUUIDPipe, Query, ParseIntPipe,
  DefaultValuePipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiQuery, ApiParam,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from './entities/order.entity';
import {
  CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto,
} from './dto/order.dto';

// ── User endpoints ────────────────────────────────────────────
@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng từ giỏ hàng' })
  createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lịch sử đơn hàng' })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  getMyOrders(
    @CurrentUser() user: User,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.findByUser(user.id, page, limit, status);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  @ApiParam({ name: 'orderId', type: 'string' })
  getOrder(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.orderService.findById(orderId, user.id);
  }

  @Post(':orderId/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng' })
  @ApiParam({ name: 'orderId', type: 'string' })
  cancelOrder(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(orderId, user.id, dto);
  }
}

// ── Admin endpoints ───────────────────────────────────────────
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles('admin', 'operator', 'super_admin')
  @ApiOperation({ summary: '[Admin] Danh sách đơn hàng' })
  @ApiQuery({ name: 'page',      required: false })
  @ApiQuery({ name: 'limit',     required: false })
  @ApiQuery({ name: 'status',    required: false, enum: OrderStatus })
  @ApiQuery({ name: 'from_date', required: false })
  @ApiQuery({ name: 'to_date',   required: false })
  getAllOrders(
    @Query('page',      new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit',     new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status')    status?: OrderStatus,
    @Query('from_date') fromDate?: string,
    @Query('to_date')   toDate?: string,
  ) {
    return this.orderService.findAll(
      page, limit, status,
      fromDate ? new Date(fromDate) : undefined,
      toDate   ? new Date(toDate)   : undefined,
    );
  }

  @Get(':orderId')
  @Roles('admin', 'operator', 'super_admin')
  @ApiOperation({ summary: '[Admin] Chi tiết đơn hàng' })
  @ApiParam({ name: 'orderId', type: 'string' })
  getOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.orderService.findById(orderId);
  }

  @Patch(':orderId/status')
  @Roles('admin', 'operator', 'super_admin')
  @ApiOperation({ summary: '[Admin] Cập nhật trạng thái đơn hàng' })
  @ApiParam({ name: 'orderId', type: 'string' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(orderId, dto, user.id);
  }
}
