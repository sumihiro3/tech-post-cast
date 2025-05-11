import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SubscriptionInfo } from '@tech-post-cast/database';
import { Request } from 'express';

/**
 * リクエストに付与されたサブスクリプション情報を取得するデコレータ
 * @param data - デコレータに渡されるデータ（未使用）
 * @param ctx - 実行コンテキスト
 * @returns サブスクリプション情報
 */
export const SubscriptionDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SubscriptionInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.subscription as SubscriptionInfo;
  },
);
