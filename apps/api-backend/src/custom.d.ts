import { WebhookEvent } from '@clerk/backend';
import { Plan } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface LoginUser {
    id: string;
    sessionId: string;
    session?: Session;
    user?: LoginUser;
  }

  interface Request {
    /**
     * ClerkのWebhookイベント
     * @see https://clerk.com/docs/webhooks/overview
     */
    webhook?: WebhookEvent;
    /**
     * Clerkのユーザー情報
     * @see https://clerk.com/docs/backend-requests/manual-jwt
     */
    user?: LoginUser;
    /**
     * サブスクリプション情報
     */
    subscriptionPlan?: Plan;
  }
}
