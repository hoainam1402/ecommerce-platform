import { Client } from '@elastic/elasticsearch';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AutocompleteDto,
  ProductDocument,
  SearchProductDto,
  SearchResult,
  SearchSortBy,
} from './search.dto';

const INDEX = 'products';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: Client;
  private isAvailable = false;

  constructor(private readonly config: ConfigService) {}

  // ─── Khởi tạo kết nối và index ────────────────────────────
  async onModuleInit() {
    const node = this.config.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200');
    const username = this.config.get<string>('ELASTICSEARCH_USERNAME');
    const password = this.config.get<string>('ELASTICSEARCH_PASSWORD');

    this.client = new Client({
      node,
      ...(username && password ? { auth: { username, password } } : {}),
      requestTimeout: 5000,
    });

    try {
      await this.client.ping();
      this.isAvailable = true;
      this.logger.log(`✅ Elasticsearch connected: ${node}`);
      await this.ensureIndex();
    } catch {
      this.isAvailable = false;
      this.logger.warn('⚠️  Elasticsearch không khả dụng — search sẽ fallback sang DB');
    }
  }

  // ─── Tạo / update mapping index ───────────────────────────
  private async ensureIndex() {
    const exists = await this.client.indices.exists({ index: INDEX });
    if (exists) return;

    await this.client.indices.create({
      index: INDEX,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            vi_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
      mappings: {
        properties: {
          id:               { type: 'keyword' },
          name:             { type: 'text', analyzer: 'vi_analyzer',
                              fields: { keyword: { type: 'keyword' } } },
          slug:             { type: 'keyword' },
          sku:              { type: 'keyword' },
          description:      { type: 'text', analyzer: 'vi_analyzer' },
          shortDescription: { type: 'text', analyzer: 'vi_analyzer' },
          basePrice:        { type: 'double' },
          salePrice:        { type: 'double' },
          brandId:          { type: 'keyword' },
          brandName:        { type: 'text', analyzer: 'vi_analyzer',
                              fields: { keyword: { type: 'keyword' } } },
          categoryIds:      { type: 'keyword' },
          categoryNames:    { type: 'text', analyzer: 'vi_analyzer' },
          tags:             { type: 'keyword' },
          avgRating:        { type: 'float' },
          reviewCount:      { type: 'integer' },
          soldCount:        { type: 'integer' },
          viewCount:        { type: 'integer' },
          status:           { type: 'keyword' },
          isFeatured:       { type: 'boolean' },
          primaryImage:     { type: 'keyword', index: false },
          updatedAt:        { type: 'date' },
        } as any,
      },
    });

    this.logger.log(`✅ Created Elasticsearch index: ${INDEX}`);
  }

  // ─── Index / upsert 1 sản phẩm ────────────────────────────
  async indexProduct(doc: ProductDocument): Promise<void> {
    if (!this.isAvailable) return;
    try {
      await this.client.index({
        index: INDEX,
        id: doc.id,
        document: doc,
      });
    } catch (err) {
      this.logger.error(`Failed to index product ${doc.id}:`, err.message);
    }
  }

  // ─── Bulk index nhiều sản phẩm ────────────────────────────
  async bulkIndex(docs: ProductDocument[]): Promise<void> {
    if (!this.isAvailable || !docs.length) return;

    const operations = docs.flatMap(doc => [
      { index: { _index: INDEX, _id: doc.id } },
      doc,
    ]);

    const result = await this.client.bulk({ operations, refresh: true });
    const errored = result.items.filter((i: any) => i.index?.error);
    if (errored.length) {
      this.logger.warn(`Bulk index: ${errored.length} errors out of ${docs.length}`);
    } else {
      this.logger.log(`Bulk indexed ${docs.length} products`);
    }
  }

  // ─── Xóa sản phẩm khỏi index ─────────────────────────────
  async removeProduct(productId: string): Promise<void> {
    if (!this.isAvailable) return;
    try {
      await this.client.delete({ index: INDEX, id: productId });
    } catch (err) {
      if (err.meta?.statusCode !== 404) {
        this.logger.error(`Failed to remove product ${productId}:`, err.message);
      }
    }
  }

  // ─── Tìm kiếm sản phẩm ───────────────────────────────────
  async search(dto: SearchProductDto): Promise<SearchResult> {
    if (!this.isAvailable) {
      return this.emptyResult(dto);
    }

    const { q, categoryId, brandId, minPrice, maxPrice,
            minRating, tags, sort, page = 1, limit = 20 } = dto;

    // ── Build query ────────────────────────────────────────
    const must: any[]   = [];
    const filter: any[] = [{ term: { status: 'active' } }];

    if (q?.trim()) {
      must.push({
        multi_match: {
          query:  q,
          fields: ['name^3', 'brandName^2', 'categoryNames^2', 'description', 'tags'],
          type:   'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 1,
        },
      });
    }

    if (categoryId) filter.push({ term: { categoryIds: categoryId } });
    if (brandId)    filter.push({ term: { brandId } });
    if (tags?.length) filter.push({ terms: { tags } });
    if (minRating)  filter.push({ range: { avgRating: { gte: minRating } } });

    const priceField = 'salePrice';   // sort/filter theo salePrice nếu có
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.push({
        range: {
          basePrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        },
      });
    }

    // ── Sort ──────────────────────────────────────────────
    const sortClause = this.buildSort(sort ?? SearchSortBy.RELEVANCE, !!q?.trim());

    // ── Aggregations ──────────────────────────────────────
    const aggs = {
      brands: {
        terms: { field: 'brandName.keyword', size: 20 },
      },
      price_stats: {
        stats: { field: 'basePrice' },
      },
    };

    const from = (page - 1) * limit;

    const response = await this.client.search({
      index: INDEX,
      from,
      size: limit,
      query: {
        bool: {
          must:   must.length ? must : [{ match_all: {} }],
          filter,
        },
      },
      sort: sortClause,
      aggs,
      highlight: q ? {
        fields: { name: {}, description: { fragment_size: 150, number_of_fragments: 1 } },
        pre_tags:  ['<mark>'],
        post_tags: ['</mark>'],
      } : undefined,
    });

    const hits  = response.hits.hits as any[];
    const total = (response.hits.total as any)?.value ?? 0;

    const data: ProductDocument[] = hits.map(hit => ({
      ...hit._source,
      _highlight: hit.highlight,
    }));

    // Parse aggregations
    const brandsAgg = (response.aggregations as any)?.brands?.buckets ?? [];

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      took: response.took,
      aggregations: {
        brands:      brandsAgg.map((b: any) => ({ key: b.key, label: b.key, count: b.doc_count })),
        categories:  [],
        priceRanges: [],
      },
    };
  }

  // ─── Autocomplete / suggest ───────────────────────────────
  async autocomplete(dto: AutocompleteDto): Promise<string[]> {
    if (!this.isAvailable || !dto.q?.trim()) return [];

    try {
      const response = await this.client.search({
        index: INDEX,
        size: dto.limit ?? 8,
        query: {
          bool: {
            must: [{
              multi_match: {
                query:  dto.q,
                fields: ['name^3', 'brandName', 'tags'],
                type:   'phrase_prefix',
              },
            }],
            filter: [{ term: { status: 'active' } }],
          },
        },
        _source: ['name', 'slug'],
      });

      return (response.hits.hits as any[]).map(h => h._source.name);
    } catch {
      return [];
    }
  }

  // ─── Reindex tất cả sản phẩm từ DB ───────────────────────
  async reindexAll(docs: ProductDocument[]): Promise<{ indexed: number }> {
    if (!this.isAvailable) {
      return { indexed: 0 };
    }

    // Xóa index cũ rồi tạo lại
    try {
      await this.client.indices.delete({ index: INDEX });
    } catch {}
    await this.ensureIndex();

    // Bulk index theo batch 200
    const batchSize = 200;
    let indexed = 0;
    for (let i = 0; i < docs.length; i += batchSize) {
      await this.bulkIndex(docs.slice(i, i + batchSize));
      indexed += Math.min(batchSize, docs.length - i);
    }

    return { indexed };
  }

  // ─── Health check ─────────────────────────────────────────
  async getHealth(): Promise<{ available: boolean; info?: any }> {
    if (!this.isAvailable) return { available: false };
    try {
      const health = await this.client.cluster.health();
      const stats  = await this.client.indices.stats({ index: INDEX });
      return {
        available: true,
        info: {
          cluster: health.status,
          docs:    (stats._all.primaries as any)?.docs?.count ?? 0,
        },
      };
    } catch {
      return { available: false };
    }
  }

  // ─── Helpers ──────────────────────────────────────────────
  private buildSort(sort: SearchSortBy, hasQuery: boolean): any[] {
    switch (sort) {
      case SearchSortBy.PRICE_ASC:   return [{ basePrice: 'asc' }];
      case SearchSortBy.PRICE_DESC:  return [{ basePrice: 'desc' }];
      case SearchSortBy.NEWEST:      return [{ updatedAt: 'desc' }];
      case SearchSortBy.BEST_SELLER: return [{ soldCount: 'desc' }];
      case SearchSortBy.TOP_RATED:   return [{ avgRating: 'desc' }, { reviewCount: 'desc' }];
      default:
        return hasQuery ? ['_score', { soldCount: 'desc' }] : [{ soldCount: 'desc' }];
    }
  }

  private emptyResult(dto: SearchProductDto): SearchResult {
    return {
      data: [], total: 0,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      totalPages: 0, took: 0,
    };
  }

  get available() { return this.isAvailable; }
}