import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { SearchService } from './search.service';
import { SearchIndexer } from './search.indexer';
import { SearchController, AdminSearchController } from './search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [SearchController, AdminSearchController],
  providers: [SearchService, SearchIndexer],
  exports: [SearchService, SearchIndexer],
})
export class SearchModule {}
