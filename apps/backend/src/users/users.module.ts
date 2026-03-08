import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserAuthProvider } from './entities/user-auth-provider.entity';
import { UserSession } from './entities/user-session.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserLoyaltyPoints } from './entities/user-loyalty-points.entity';
import { LoyaltyPointTransaction } from './entities/loyalty-point-transaction.entity';
import { UsersService } from './users.service';
import { AddressService } from './address.service';
import { LoyaltyService } from './loyalty.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, UserAuthProvider, UserSession,
      UserAddress, UserLoyaltyPoints, LoyaltyPointTransaction,
    ]),
  ],
  providers: [UsersService, AddressService, LoyaltyService],
  controllers: [UsersController],
  exports: [UsersService, AddressService, LoyaltyService],
})
export class UsersModule {}
