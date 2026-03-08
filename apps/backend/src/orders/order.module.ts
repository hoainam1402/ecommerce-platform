import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Shipment, ShipmentEvent } from './entities/shipment.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Promotion } from '../promotions/promotion.entity';
import { UserAddress } from '../users/entities/user-address.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { OrderService } from './order.service';
import { OrderController, AdminOrderController } from './order.controller';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, OrderItem, Payment,
      Shipment, ShipmentEvent,
      OrderStatusHistory, Promotion,
      UserAddress, ProductVariant,
    ]),
    CartModule,
    UsersModule,
  ],
  controllers: [OrderController, AdminOrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
