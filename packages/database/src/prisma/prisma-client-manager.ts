import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { prismaTransactionClientStorage } from './prisma-transaction-client-storage';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaClientManager {
  private readonly prisma: PrismaService;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.prisma = new PrismaService(this.configService);
  }

  /**
   * PrismaClient を取得する
   * @returns PrismaClient
   */
  public getClient(): Prisma.TransactionClient {
    const prismaTransactionClient = this.getPrismaTransactionClient();
    if (prismaTransactionClient) {
      return prismaTransactionClient;
    }
    return this.prisma;
  }

  /**
   * トランザクション処理を実行する
   * @param callback トランザクション処理
   * @param options トランザクションオプション
   * @returns トランザクション処理の結果
   */
  async transaction<T>(fn: () => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  },
): Promise<T> {
  try {
    const prismaTransactionClient = this.getPrismaTransactionClient();
    // トランザクションクライアントが存在する場合は、そのクライアントを使用してトランザクション処理を実行する
    if (prismaTransactionClient) {
      return await fn();
    }
    // トランザクションクライアントが存在しない場合は、
    // 新しいトランザクションクライアントを作成してトランザクション処理を実行する
    return await this.prisma.$transaction(
      async (newPrismaTransactionClient) => {
        prismaTransactionClientStorage.run(newPrismaTransactionClient, () => {});
        // トランザクション処理を実行する
        const result = await fn();
        // Prisma.TransactionClient を AsyncLocalStorage から削除する
        this.removePrismaTransactionClient();
        // トランザクション処理の結果を返す
        return result;
      },
      options,
    );
  } catch (error) {
    this.removePrismaTransactionClient();
    throw error;
  }
}

  /**
   * Async Local Storage から PrismaTransactionClient を取得する
   * @returns PrismaClient
   */
  private getPrismaTransactionClient(): Prisma.TransactionClient | null {
    const prismaTransactionClient = prismaTransactionClientStorage.getStore();
    if (!prismaTransactionClient) {
      return null;
    }
    return prismaTransactionClient;
  }

  /**
   * Async Local Storage から PrismaTransactionClient を削除する
   */
  private removePrismaTransactionClient() {
    prismaTransactionClientStorage.run(null, () => {});
  }
}
