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
    /** LINE Messaging API クライアント */
    lineClient: messagingApi.MessagingApiClient;
    /** Prisma クライアント */
    prismaClient: PrismaClient;
  };

  Bindings: {
    /** LINE Bot のチャンネルアクセストークン */
    LINE_BOT_CHANNEL_ACCESS_TOKEN: string;
    /** LINE Bot のチャンネルシークレット */
    LINE_BOT_CHANNEL_SECRET: string;
    /** データベース接続情報 */
    DATABASE_URL: string;
    /** 番組ファイルの URL プレフィックス */
    PROGRAM_FILE_URL_PREFIX: string;
    /** LP の URL プレフィックス */
    LP_URL_PREFIX: string;
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
