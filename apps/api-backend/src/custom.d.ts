import { WebhookEvent } from '@clerk/backend';

declare module 'express-serve-static-core' {
  interface Request {
    webhook?: WebhookEvent;
  }
}
