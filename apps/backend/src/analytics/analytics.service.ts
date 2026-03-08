import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment, PaymentStatus } from '../orders/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import {
  DateRangeDto, TopProductsDto, DateRangePreset, GroupBy,
  DashboardSummary, MetricWithChange, RevenueChartPoint,
  TopProduct, OrderStatusBreakdown, CustomerStats,
  PaymentMethodBreakdown, InventoryAlert,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Order)    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Payment)  private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)     private readonly userRepo: Repository<User>,
    @InjectRepository(Product)  private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variantRepo: Repository<ProductVariant>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Dashboard tổng quan ──────────────────────────────────
  async getDashboardSummary(dto: DateRangeDto): Promise<DashboardSummary> {
    const { from, to, prevFrom, prevTo } = this.resolveRange(dto);

    const [
      revenue, prevRevenue,
      orders,  prevOrders,
      customers, prevCustomers,
    ] = await Promise.all([
      this.sumRevenue(from, to),
      this.sumRevenue(prevFrom, prevTo),
      this.countOrders(from, to),
      this.countOrders(prevFrom, prevTo),
      this.countNewCustomers(from, to),
      this.countNewCustomers(prevFrom, prevTo),
    ]);

    const avgOrder     = orders > 0 ? revenue / orders : 0;
    const prevAvgOrder = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    // Đơn hàng pending/processing
    const [pendingOrders, processingOrders] = await Promise.all([
      this.orderRepo.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepo.count({ where: { status: OrderStatus.PROCESSING } }),
    ]);

    // Sản phẩm sắp hết hàng (stock < 5)
    const lowStockProducts = await this.variantRepo
      .createQueryBuilder('v')
      .where('v.stock_quantity <= 5 AND v.stock_quantity > 0 AND v.is_active = true')
      .getCount();

    // Conversion rate: đơn delivered / tổng đơn trong kỳ
    const deliveredOrders = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status = :s', { s: OrderStatus.DELIVERED })
      .getCount();
    const conversionRate     = orders > 0 ? (deliveredOrders / orders) * 100 : 0;
    const prevDelivered      = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.created_at BETWEEN :from AND :to', { from: prevFrom, to: prevTo })
      .andWhere('o.status = :s', { s: OrderStatus.DELIVERED })
      .getCount();
    const prevConversionRate = prevOrders > 0 ? (prevDelivered / prevOrders) * 100 : 0;

    return {
      revenue:          this.metric(revenue, prevRevenue),
      orders:           this.metric(orders, prevOrders),
      newCustomers:     this.metric(customers, prevCustomers),
      avgOrderValue:    this.metric(avgOrder, prevAvgOrder),
      conversionRate:   this.metric(conversionRate, prevConversionRate),
      pendingOrders,
      processingOrders,
      lowStockProducts,
    };
  }

  // ─── Biểu đồ doanh thu theo thời gian ────────────────────
  async getRevenueChart(dto: DateRangeDto): Promise<RevenueChartPoint[]> {
    const { from, to } = this.resolveRange(dto);
    const groupBy = dto.groupBy ?? GroupBy.DAY;

    const dateTrunc = {
      [GroupBy.DAY]:   'day',
      [GroupBy.WEEK]:  'week',
      [GroupBy.MONTH]: 'month',
    }[groupBy];

    const rows = await this.dataSource.query(`
      SELECT
        DATE_TRUNC('${dateTrunc}', o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS date,
        COALESCE(SUM(o.total_amount), 0)::float   AS revenue,
        COUNT(o.id)::int                           AS orders,
        COALESCE(AVG(o.total_amount), 0)::float    AS avg_order
      FROM orders o
      WHERE
        o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY 1
      ORDER BY 1
    `, [from, to]);

    return rows.map((r: any) => ({
      date:     r.date.toISOString().slice(0, 10),
      revenue:  Math.round(r.revenue),
      orders:   r.orders,
      avgOrder: Math.round(r.avg_order),
    }));
  }

  // ─── Top sản phẩm bán chạy ────────────────────────────────
  async getTopProducts(dto: TopProductsDto): Promise<TopProduct[]> {
    const { from, to } = this.resolveRange(dto);
    const limit = dto.limit ?? 10;

    const rows = await this.dataSource.query(`
      SELECT
        oi.product_id,
        oi.product_name,
        p.slug,
        pi.url           AS image,
        SUM(oi.quantity)::int                     AS sold_count,
        SUM(oi.total_price)::float                AS revenue,
        COALESCE(p.avg_rating, 0)::float          AS avg_rating
      FROM order_items oi
      JOIN orders o   ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN product_images pi ON pi.product_id = oi.product_id AND pi.is_primary = true
      WHERE
        o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY oi.product_id, oi.product_name, p.slug, pi.url, p.avg_rating
      ORDER BY sold_count DESC
      LIMIT $3
    `, [from, to, limit]);

    return rows.map((r: any) => ({
      id:        r.product_id,
      name:      r.product_name,
      slug:      r.slug ?? '',
      image:     r.image ?? null,
      soldCount: r.sold_count,
      revenue:   Math.round(r.revenue),
      avgRating: r.avg_rating,
    }));
  }

  // ─── Phân bổ trạng thái đơn hàng ─────────────────────────
  async getOrderStatusBreakdown(dto: DateRangeDto): Promise<OrderStatusBreakdown[]> {
    const { from, to } = this.resolveRange(dto);

    const rows = await this.dataSource.query(`
      SELECT
        status,
        COUNT(*)::int AS count
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY status
      ORDER BY count DESC
    `, [from, to]);

    const total = rows.reduce((s: number, r: any) => s + r.count, 0);

    return rows.map((r: any) => ({
      status: r.status,
      count:  r.count,
      pct:    total > 0 ? Math.round((r.count / total) * 100 * 10) / 10 : 0,
    }));
  }

  // ─── Thống kê khách hàng ──────────────────────────────────
  async getCustomerStats(dto: TopProductsDto): Promise<CustomerStats> {
    const { from, to } = this.resolveRange(dto);
    const limit = dto.limit ?? 10;

    const [total, newThisPeriod] = await Promise.all([
      this.userRepo.count({ where: { role: 'customer' as any } }),
      this.countNewCustomers(from, to),
    ]);

    // Khách hàng quay lại (đặt >= 2 đơn)
    const returningResult = await this.dataSource.query(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT user_id
        FROM orders
        WHERE status NOT IN ('cancelled', 'refunded')
        GROUP BY user_id
        HAVING COUNT(*) >= 2
      ) sub
    `);
    const returning = parseInt(returningResult[0]?.count ?? '0');

    // Top người chi nhiều nhất
    const topSpenders = await this.dataSource.query(`
      SELECT
        u.id          AS user_id,
        u.full_name,
        u.email,
        SUM(o.total_amount)::float  AS total_spent,
        COUNT(o.id)::int            AS order_count
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE
        o.created_at BETWEEN $1 AND $2
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY u.id, u.full_name, u.email
      ORDER BY total_spent DESC
      LIMIT $3
    `, [from, to, limit]);

    const retentionRate = total > 0 ? Math.round((returning / total) * 100 * 10) / 10 : 0;

    return {
      total,
      newThisPeriod,
      returning,
      retentionRate,
      topSpenders: topSpenders.map((r: any) => ({
        userId:     r.user_id,
        fullName:   r.full_name,
        email:      r.email,
        totalSpent: Math.round(r.total_spent),
        orderCount: r.order_count,
      })),
    };
  }

  // ─── Phân bổ phương thức thanh toán ──────────────────────
  async getPaymentBreakdown(dto: DateRangeDto): Promise<PaymentMethodBreakdown[]> {
    const { from, to } = this.resolveRange(dto);

    const rows = await this.dataSource.query(`
      SELECT
        p.method,
        COUNT(p.id)::int           AS count,
        SUM(p.amount)::float       AS revenue
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE
        p.status = 'paid'
        AND o.created_at BETWEEN $1 AND $2
      GROUP BY p.method
      ORDER BY revenue DESC
    `, [from, to]);

    const totalRevenue = rows.reduce((s: number, r: any) => s + r.revenue, 0);

    return rows.map((r: any) => ({
      method:  r.method,
      count:   r.count,
      revenue: Math.round(r.revenue),
      pct:     totalRevenue > 0
        ? Math.round((r.revenue / totalRevenue) * 100 * 10) / 10
        : 0,
    }));
  }

  // ─── Cảnh báo tồn kho thấp ────────────────────────────────
  async getLowStockAlerts(threshold = 5): Promise<InventoryAlert[]> {
    const rows = await this.dataSource.query(`
      SELECT
        p.id    AS product_id,
        p.name  AS product_name,
        v.id    AS variant_id,
        v.name  AS variant_name,
        v.sku,
        v.stock_quantity AS stock
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      WHERE
        v.is_active = true
        AND v.stock_quantity <= $1
        AND v.stock_quantity >= 0
        AND p.deleted_at IS NULL
      ORDER BY v.stock_quantity ASC
      LIMIT 50
    `, [threshold]);

    return rows.map((r: any) => ({
      productId:   r.product_id,
      productName: r.product_name,
      variantId:   r.variant_id,
      variantName: r.variant_name,
      sku:         r.sku ?? '',
      stock:       r.stock,
      threshold,
    }));
  }

  // ─── Helpers ──────────────────────────────────────────────
  private resolveRange(dto: DateRangeDto): {
    from: Date; to: Date; prevFrom: Date; prevTo: Date;
  } {
    const now   = new Date();
    let from: Date, to: Date;

    switch (dto.preset) {
      case DateRangePreset.TODAY:
        from = this.startOfDay(now);
        to   = now;
        break;
      case DateRangePreset.YESTERDAY: {
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        from = this.startOfDay(yesterday);
        to   = this.endOfDay(yesterday);
        break;
      }
      case DateRangePreset.LAST_7:
        from = new Date(now); from.setDate(now.getDate() - 7);
        to   = now;
        break;
      case DateRangePreset.LAST_90:
        from = new Date(now); from.setDate(now.getDate() - 90);
        to   = now;
        break;
      case DateRangePreset.THIS_MONTH:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to   = now;
        break;
      case DateRangePreset.LAST_MONTH: {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        from = lm;
        to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      }
      case DateRangePreset.THIS_YEAR:
        from = new Date(now.getFullYear(), 0, 1);
        to   = now;
        break;
      case DateRangePreset.CUSTOM:
        from = dto.fromDate ? new Date(dto.fromDate) : new Date(now.setDate(now.getDate() - 30));
        to   = dto.toDate   ? new Date(dto.toDate)   : new Date();
        break;
      default: // LAST_30
        from = new Date(); from.setDate(from.getDate() - 30);
        to   = new Date();
    }

    // Kỳ so sánh = cùng độ dài, trước đó
    const diffMs  = to.getTime() - from.getTime();
    const prevTo   = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - diffMs);

    return { from, to, prevFrom, prevTo };
  }

  private async sumRevenue(from: Date, to: Date): Promise<number> {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_amount), 0)', 'total')
      .where('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      })
      .getRawOne();
    return parseFloat(result?.total ?? '0');
  }

  private async countOrders(from: Date, to: Date): Promise<number> {
    return this.orderRepo
      .createQueryBuilder('o')
      .where('o.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('o.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      })
      .getCount();
  }

  private async countNewCustomers(from: Date, to: Date): Promise<number> {
    return this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at BETWEEN :from AND :to', { from, to })
      .andWhere('u.role = :role', { role: 'customer' })
      .getCount();
  }

  private metric(value: number, prevValue: number): MetricWithChange {
    const change = prevValue > 0
      ? Math.round(((value - prevValue) / prevValue) * 100 * 10) / 10
      : value > 0 ? 100 : 0;
    return {
      value:     Math.round(value),
      prevValue: Math.round(prevValue),
      change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    };
  }

  private startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  }

  private endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  }
}
