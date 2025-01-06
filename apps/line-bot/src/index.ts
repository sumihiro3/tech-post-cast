import { messagingApi, middleware, webhook } from '@line/bot-sdk';
import { Hono } from 'hono';
import { handleWebhookEvent } from './event-handler';

type Bindings = {
  LINE_BOT_CHANNEL_ACCESS_TOKEN: string;
  LINE_BOT_CHANNEL_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  console.debug(`GET / called`, {
    env: c.env,
  });
  return c.text('Hello Hono!');
});

/**
 * LINE Messaging API からの Webhook イベントを処理する
 */
app.post('/webhook', async (c) => {
  console.debug(`POST /webhook called`);
  const client = createLineBotClient(c.env.LINE_BOT_CHANNEL_ACCESS_TOKEN);
  middleware({ channelSecret: c.env.LINE_BOT_CHANNEL_SECRET });
  // リクエストから Webhook イベントを取得
  const events: webhook.Event[] = await c.req
    .json()
    .then((data) => data.events);
  // Webhook イベントを処理
  await Promise.all(
    events.map(async (event: webhook.Event) => {
      try {
        await handleWebhookEvent(event, client);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err);
        }
        return c.status(500);
      }
    }),
  );
  return c.text('OK');
});

/**
 * Messaging API にアクセスするためのクライアントを生成する
 */
const createLineBotClient = (
  channelAccessToken: string,
): messagingApi.MessagingApiClient => {
  console.debug(`LineBotService.createLineBotClient() called`);
  return new messagingApi.MessagingApiClient({
    channelAccessToken,
  });
};

export default app;
