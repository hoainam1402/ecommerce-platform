import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './promotion.entity';
import { PromotionUsage } from './promotion-usage.entity';
import { PromotionService } from './promotion.service';
import { PromotionController, AdminPromotionController } from './promotion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, PromotionUsage])],
  controllers: [PromotionController, AdminPromotionController],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionModule {}
