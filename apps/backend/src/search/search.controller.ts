import {
  Controller, Get, Post, Query, Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchIndexer } from './search.indexer';
import { Public } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SearchProductDto, AutocompleteDto } from './search.dto';

// ── Public search ─────────────────────────────────────────────
@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly indexer: SearchIndexer,
  ) {}

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm full-text' })
  search(@Query() dto: SearchProductDto) {
    return this.searchService.search(dto);
  }

  @Get('autocomplete')
  @Public()
  @ApiOperation({ summary: 'Gợi ý từ khoá (autocomplete)' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false })
  autocomplete(@Query() dto: AutocompleteDto) {
    return this.searchService.autocomplete(dto);
  }
}

// ── Admin search management ───────────────────────────────────
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/search')
export class AdminSearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly indexer: SearchIndexer,
  ) {}

  @Get('health')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: '[Admin] Elasticsearch health check' })
  health() {
    return this.searchService.getHealth();
  }

  @Post('reindex')
  @Roles('super_admin')
  @ApiOperation({ summary: '[Admin] Reindex toàn bộ sản phẩm từ DB' })
  reindex() {
    return this.indexer.reindexAll();
  }
}
