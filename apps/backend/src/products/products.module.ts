import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { BrandService } from './brand.service';
import {
  ProductsController,
  CategoriesController,
  BrandsController,
  AdminProductsController,
  AdminCategoriesController,
  AdminBrandsController,
} from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, ProductVariant, ProductImage,
      InventoryTransaction, Category, Brand,
    ]),
  ],
  providers: [ProductService, CategoryService, BrandService],
  controllers: [
    ProductsController,
    CategoriesController,
    BrandsController,
    AdminProductsController,
    AdminCategoriesController,
    AdminBrandsController,
  ],
  exports: [ProductService, CategoryService, BrandService],
})
export class ProductsModule {}
