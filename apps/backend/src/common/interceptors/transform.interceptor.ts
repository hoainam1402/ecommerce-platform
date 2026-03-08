import {
  CallHandler,
  ExecutionContext,
  Injectable, NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((payload) => {
        // Pagination: { data[], meta: { total, page, limit, totalPages } }
        if (
          payload !== null &&
          typeof payload === 'object' &&
          Array.isArray(payload.data) &&
          payload.meta !== undefined
        ) {
          return {
            success: true,
            data: payload.data,
            meta: payload.meta,
            timestamp: new Date().toISOString(),
          };
        }

        // Pagination cũ: { data[], total, page, limit }
        if (
          payload !== null &&
          typeof payload === 'object' &&
          Array.isArray(payload.data) &&
          typeof payload.total === 'number'
        ) {
          const { data, total, page = 1, limit = 20 } = payload;
          return {
            success: true,
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            timestamp: new Date().toISOString(),
          };
        }

        // Response thường
        return {
          success: true,
          data: payload ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
