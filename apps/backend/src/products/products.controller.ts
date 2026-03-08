import {
  Controller, Get, Post, Put, Patch, Delete, Body,
  Param, Query, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { BrandService } from './brand.service';
import { Public, Roles } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import {
  CreateProductDto, UpdateProductDto, ProductQueryDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateBrandDto, UpdateBrandDto,
  CreateVariantDto, AdjustStockDto,
} from './dto/product.dto';

// ══════════════════════════════════════════════════════════════
// PUBLIC — Products
// ══════════════════════════════════════════════════════════════
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm (filter/sort/search)' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productService.findBySlug(slug);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Sản phẩm liên quan' })
  getRelated(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.getRelated(id);
  }
}

// ══════════════════════════════════════════════════════════════
// PUBLIC — Categories
// ══════════════════════════════════════════════════════════════
@ApiTags('Products')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Cây danh mục sản phẩm' })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  findTree(@Query('parentId') parentId?: string) {
    return this.categoryService.findTree(parentId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết danh mục' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findById(id);
  }
}

// ══════════════════════════════════════════════════════════════
// PUBLIC — Brands
// ══════════════════════════════════════════════════════════════
@ApiTags('Products')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandService: BrandService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Danh sách thương hiệu' })
  findAll() {
    return this.brandService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thương hiệu' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandService.findById(id);
  }
}

// ══════════════════════════════════════════════════════════════
// ADMIN — Products CRUD + Inventory
// ══════════════════════════════════════════════════════════════
@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATOR)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Danh sách sản phẩm (mọi status)' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll({ ...query, status: query.status });
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Tạo sản phẩm mới' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Cập nhật sản phẩm' })
  @ApiParam({ name: 'id', type: 'string' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xóa sản phẩm (soft delete)' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }

  // ── Variants ─────────────────────────────────────────────
  @Post(':id/variants')
  @ApiOperation({ summary: '[Admin] Thêm variant' })
  @ApiParam({ name: 'id', type: 'string' })
  addVariant(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateVariantDto) {
    return this.productService.addVariant(id, dto);
  }

  @Put('variants/:variantId')
  @ApiOperation({ summary: '[Admin] Cập nhật variant' })
  @ApiParam({ name: 'variantId', type: 'string' })
  updateVariant(@Param('variantId', ParseUUIDPipe) variantId: string, @Body() dto: CreateVariantDto) {
    return this.productService.updateVariant(variantId, dto);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xóa variant' })
  @ApiParam({ name: 'variantId', type: 'string' })
  removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productService.removeVariant(variantId);
  }

  // ── Inventory ─────────────────────────────────────────────
  @Patch('variants/:variantId/stock')
  @ApiOperation({ summary: '[Admin] Điều chỉnh tồn kho' })
  @ApiParam({ name: 'variantId', type: 'string' })
  adjustStock(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: User,
  ) {
    return this.productService.adjustStock(variantId, dto, user.id);
  }

  @Get('variants/:variantId/stock/history')
  @ApiOperation({ summary: '[Admin] Lịch sử nhập xuất kho' })
  @ApiParam({ name: 'variantId', type: 'string' })
  getStockHistory(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.productService.getInventoryHistory(variantId);
  }

  // ── Images ───────────────────────────────────────────────
  @Post(':id/images')
  @ApiOperation({ summary: '[Admin] Thêm ảnh sản phẩm' })
  @ApiParam({ name: 'id', type: 'string' })
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { url: string; altText?: string; variantId?: string; isPrimary?: boolean },
  ) {
    return this.productService.addImage(id, body);
  }

  @Delete('images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xóa ảnh' })
  @ApiParam({ name: 'imageId', type: 'string' })
  removeImage(@Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.productService.removeImage(imageId);
  }
}

// ══════════════════════════════════════════════════════════════
// ADMIN — Categories & Brands CRUD
// ══════════════════════════════════════════════════════════════
@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Tất cả danh mục' })
  findAll() { return this.categoryService.findAll(); }

  @Post()
  @ApiOperation({ summary: '[Admin] Tạo danh mục' })
  create(@Body() dto: CreateCategoryDto) { return this.categoryService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Cập nhật danh mục' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xóa danh mục' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.categoryService.remove(id); }
}

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Tất cả thương hiệu' })
  findAll() { return this.brandService.findAll(false); }

  @Post()
  @ApiOperation({ summary: '[Admin] Tạo thương hiệu' })
  create(@Body() dto: CreateBrandDto) { return this.brandService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: '[Admin] Cập nhật thương hiệu' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.brandService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xóa thương hiệu' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.brandService.remove(id); }
}
