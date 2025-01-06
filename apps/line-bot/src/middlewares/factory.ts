import { messagingApi } from '@line/bot-sdk';
import { PrismaClient } from '@prisma/client';
import { createFactory } from 'hono/factory';
import { createLineBotClient } from './line-api';
import { createPrismaClient } from './prisma';

/**
 * 実行環境情報
 */
export type HonoEnv = {
  Variables: {
    lineClient: messagingApi.MessagingApiClient;
    prismaClient: PrismaClient;
  };

  Bindings: {
    LINE_BOT_CHANNEL_ACCESS_TOKEN: string;
    LINE_BOT_CHANNEL_SECRET: string;
    DATABASE_URL: string;
  };
};

/**
 * Factory ヘルパー
 */
export default createFactory<HonoEnv>({
  initApp: (app) => {
    app.use(async (c, next) => {
      const lineClient = createLineBotClient(
        c.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
      );
      c.set('lineClient', lineClient);
      const prismaClient = createPrismaClient(c.env.DATABASE_URL);
      c.set('prismaClient', prismaClient);
      await next();
    });
  },
});
