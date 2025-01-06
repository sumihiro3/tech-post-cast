import { middleware, webhook } from '@line/bot-sdk';
import { Context } from 'hono';
import { handleWebhookEvent } from './event-handler';
import factory, { HonoEnv } from './middlewares/factory';

const app = factory.createApp();

app.get('/', (c) => {
  console.debug(`GET / called`, {
    env: c.env,
  });
  return c.text('Hello Hono!');
});

/**
 * LINE Messaging API からの Webhook イベントを処理する
 */
app.post('/webhook', async (context: Context<HonoEnv>) => {
  console.debug(`POST /webhook called`);
  middleware({ channelSecret: context.env.LINE_BOT_CHANNEL_SECRET });
  // リクエストから Webhook イベントを取得
  const events: webhook.Event[] = await context.req
    .json()
    .then((data) => data.events);
  // Webhook イベントを処理
  await Promise.all(
    events.map(async (event: webhook.Event) => {
      try {
        await handleWebhookEvent(context, event);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err);
        }
        return context.status(500);
      }
    }),
  );
  return context.text('OK');
});

export default app;
