import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { storage } from './storage';

/**
 * CustomLoggerService で出力するログに、リクエストで一意となるリクエストIDを付与するためのミドルウェア
 */
@Injectable()
export class CustomLoggerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    let requestId = '';
    const lambdaContext = req.headers['x-amzn-lambda-context'] as string;
    if (lambdaContext) {
      try {
        // lambdaContext を JSON にパースして、リクエストID を取得する
        const context = JSON.parse(lambdaContext)
        requestId = context['request_id'];
      } catch (error) {
        // Pass
      }
    }
    if (!requestId) {
      // リクエストID が取得できなかった場合は、新規に生成する
      // リクエストごとにユニークなIDを生成
      console.log('requestId is not found. Generate new requestId.')
      requestId = randomUUID();
    }
    // AsyncLocalStorage にリクエストID を保存する
    storage.run(requestId, next);
  }
}
