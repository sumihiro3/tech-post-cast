import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * リクエストのログを出力するミドルウェア
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, _: Response, next: () => void): void {
    this.logger.log(this.createRequestLogMessage(req));
    next();
  }

  private createRequestLogMessage(req: Request): string {
    const { body, headers } = req;

    const message = `API request 
    [url=${req.url}]; 
    [method=${req.method}]; 
    [body=${JSON.stringify(body)}];
    [headers=${JSON.stringify(headers)}];
    [ip=${req.ip}]`;
    return message;
  }
}
