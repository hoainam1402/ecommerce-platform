import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let code    = 'INTERNAL_ERROR';
    let message = 'Có lỗi xảy ra, vui lòng thử lại';
    let details: any[] = [];

    // NestJS HttpException
    if (exception instanceof HttpException) {
      status  = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : (res.message || message);
      code    = res.error || HttpStatus[status];

      // ValidationPipe errors (array of messages)
      if (Array.isArray(res.message)) {
        details = res.message.map((m: string) => ({ issue: m }));
        message = 'Dữ liệu đầu vào không hợp lệ';
        code    = 'VALIDATION_ERROR';
      }
    }

    // TypeORM unique constraint
    else if (exception instanceof QueryFailedError) {
      const err = exception as any;
      if (err.code === '23505') {           // unique_violation
        status  = HttpStatus.CONFLICT;
        code    = 'DUPLICATE_ENTRY';
        message = 'Dữ liệu đã tồn tại';
      }
    }

    // Log lỗi nghiêm trọng
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
