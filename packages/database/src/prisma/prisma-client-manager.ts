import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import * as cuid from 'cuid';
import { prismaTransactionClientStorage } from './prisma-transaction-client-storage';
import { PrismaService } from './prisma.service';

// モデル別の接頭辞マッピングを定義
const MODEL_ID_PREFIXES: Record<string, string> = {
  ListenerLetter: 'listener-letter_',
  Plan: 'plan_',
  Subscription: 'subscr_',
  PersonalizedFeed: 'feed_',
  AppUser: 'user_',
  QiitaPost: 'post_',
  HeadlineTopicProgram: 'htprogram_',
  Program: 'program_',
  FeedFilterGroup: 'feed-flt-gr_',
  LikesCountFilter: 'likes-flt_',
  TagFilter: 'tag-flt_',
  AuthorFilter: 'author-flt_',
  PersonalizedFeedProgram: 'feed-pgm_',
  // 他のモデルも必要に応じて追加
};

@Injectable()
export class PrismaClientManager {
  private readonly prisma: PrismaService;
  private readonly logger = new Logger(PrismaClientManager.name);

  constructor(private readonly configService: ConfigService) {
    this.prisma = new PrismaService(this.configService);
    this.setupPrefixedIds();
    this.logger.log('PrismaClientManager initialized with prefixed IDs extension');
  }

  /**
   * PrismaClient に接頭辞付きIDを生成する拡張機能を設定する
   * モデル作成時に自動的に接頭辞付きのIDを生成する
   */
  private setupPrefixedIds(): void {
    const logger = this.logger;
    logger.log('Setting up prefixed IDs for models: ' + Object.keys(MODEL_ID_PREFIXES).join(', '));

    this.prisma.$use(async (params, next) => {
      // Prismaのモデル名とオペレーションをログ出力
      logger.debug(`Processing operation: ${params.action} for model: ${params.model}`, { params });

      // createとcreateMany操作にのみ適用
      if (params.action === 'create') {
        // モデル名に対応する接頭辞が定義されているか確認
        const prefix = MODEL_ID_PREFIXES[params.model as keyof typeof MODEL_ID_PREFIXES];

        if (prefix && params.args.data && !params.args.data.id) {
          // IDがまだ設定されていない場合、接頭辞付きのcuidを生成
          const prefixedId = `${prefix}${cuid()}`;
          logger.log(`Generating prefixed ID: ${prefixedId} for model: ${params.model}`);

          params.args.data = {
            ...params.args.data,
            id: prefixedId,
          };
        }
      }

      if (params.action === 'createMany') {
        // モデル名に対応する接頭辞が定義されているか確認
        const prefix = MODEL_ID_PREFIXES[params.model as keyof typeof MODEL_ID_PREFIXES];

        if (prefix && params.args.data && Array.isArray(params.args.data)) {
          // データが配列の場合、各要素にIDを設定
          params.args.data = params.args.data.map((item: Record<string, any>) => {
            if (!item.id) {
              const prefixedId = `${prefix}${cuid()}`;
              logger.log(`Generating prefixed ID: ${prefixedId} for model: ${params.model}`);
              return { ...item, id: prefixedId };
            }
            return item;
          });
        }
      }

      return next(params);
    });
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
  async transaction<T>(
    fn: () => Promise<T>,
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
      return await this.prisma.$transaction(async (newPrismaTransactionClient) => {
        prismaTransactionClientStorage.run(newPrismaTransactionClient, () => {});
        // トランザクション処理を実行する
        const result = await fn();
        // Prisma.TransactionClient を AsyncLocalStorage から削除する
        this.removePrismaTransactionClient();
        // トランザクション処理の結果を返す
        return result;
      }, options);
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
