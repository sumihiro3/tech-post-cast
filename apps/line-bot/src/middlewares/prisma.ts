import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

/**
 * PrismClient を生成する
 * @param connectionString DB接続文字列
 * @returns PrismaClient
 */
export const createPrismaClient = (connectionString: string) => {
  // https://www.prisma.io/docs/orm/overview/databases/neon#how-to-use-neons-serverless-driver-with-prisma-orm-preview
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
};
