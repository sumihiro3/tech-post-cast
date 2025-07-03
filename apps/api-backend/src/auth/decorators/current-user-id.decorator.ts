import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * リクエストから現在のユーザーIDを取得するデコレータ
 * 認証されたユーザーのIDを取得します
 */
export const CurrentUserId = createParamDecorator(
  (_property: string, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user?.id;
  },
);
