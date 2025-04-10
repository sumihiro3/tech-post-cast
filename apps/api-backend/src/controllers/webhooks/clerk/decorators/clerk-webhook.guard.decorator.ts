import { WebhookEvent } from '@clerk/backend';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * ClerkのWebhookイベントを取得するデコレーター
 * @see https://clerk.com/docs/webhooks/overview
 */
export const ClerkWebhookEventGuardDecorator = createParamDecorator(
  (_property: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.webhook as WebhookEvent;
  },
);
