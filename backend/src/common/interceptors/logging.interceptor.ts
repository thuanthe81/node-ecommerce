import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const contentLength = response.get('content-length') || 0;
          const responseTime = Date.now() - startTime;

          this.logger.log(
            `${method} ${url} ${statusCode} ${contentLength}bytes - ${responseTime}ms - ${ip} - ${userAgent}`,
          );
        },
        error: (error) => {
          const statusCode = error.status || 500;
          const responseTime = Date.now() - startTime;

          this.logger.error(
            `${method} ${url} ${statusCode} - ${responseTime}ms - ${ip} - ${userAgent} - Error: ${error.message}`,
          );

          // Log detailed error for debugging
          if (error.response) {
            this.logger.error(`Error details: ${JSON.stringify(error.response)}`);
          }
        },
      }),
    );
  }
}
