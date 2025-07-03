import { WebhookEvent } from '@clerk/backend';
import { Plan } from '@prisma/client';
import { SubscriptionInfo } from '@tech-post-cast/database';

declare global {
  namespace Express {
    interface User {
      id: string;
      sessionId: string;
      session?: Session;
      user?: User;
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
      user?: User;
      /**
       * サブスクリプション情報
       */
      subscriptionPlan?: Plan;
      /**
       * サブスクリプション状態
       */
      subscription?: SubscriptionInfo;
    }
  }
}
