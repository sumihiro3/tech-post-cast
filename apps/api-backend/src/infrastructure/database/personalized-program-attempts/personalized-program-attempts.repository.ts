import {
  IPersonalizedProgramAttemptsRepository,
  PaginationOptions,
  PersonalizedProgramAttemptsResult,
  PersonalizedProgramAttemptsWithRelationsResult,
} from '@/domains/personalized-program-attempts/personalized-program-attempts.repository.interface';
import {
  PersonalizedProgramAttemptDatabaseError,
  PersonalizedProgramAttemptRetrievalError,
} from '@/types/errors';
import { Injectable, Logger } from '@nestjs/common';
import { PersonalizedProgramAttempt } from '@prisma/client';
import { PrismaClientManager } from '@tech-post-cast/database';

@Injectable()
export class PersonalizedProgramAttemptsRepository
  implements IPersonalizedProgramAttemptsRepository
{
  private readonly logger = new Logger(
    PersonalizedProgramAttemptsRepository.name,
  );

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定フィードIDの番組生成試行履歴一覧をページネーション付きで取得する
   */
  async findByFeedIdWithPagination(
    feedId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsResult> {
    this.logger.debug(
      'PersonalizedProgramAttemptsRepository.findByFeedIdWithPagination called',
      { feedId, options },
    );

    try {
      const client = this.prisma.getClient();

      // 総件数を取得
      const totalCount = await client.personalizedProgramAttempt.count({
        where: { feedId },
      });

      // 試行履歴一覧を取得
      const attempts = await client.personalizedProgramAttempt.findMany({
        where: { feedId },
        orderBy: options.orderBy || { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      });

      this.logger.log('フィード別番組生成試行履歴一覧を取得しました', {
        feedId,
        totalCount,
        retrievedCount: attempts.length,
      });

      return {
        attempts,
        totalCount,
      };
    } catch (error) {
      const errorMessage = `フィード [${feedId}] の番組生成試行履歴一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId,
        options,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定フィードIDの番組生成試行履歴の総件数を取得する
   */
  async countByFeedId(feedId: string): Promise<number> {
    this.logger.debug(
      'PersonalizedProgramAttemptsRepository.countByFeedId called',
      { feedId },
    );

    try {
      const client = this.prisma.getClient();

      const count = await client.personalizedProgramAttempt.count({
        where: { feedId },
      });

      this.logger.log(
        `フィード [${feedId}] の番組生成試行履歴件数を取得しました`,
        {
          feedId,
          count,
        },
      );

      return count;
    } catch (error) {
      const errorMessage = `フィード [${feedId}] の番組生成試行履歴件数の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramAttemptDatabaseError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定ユーザーIDの番組生成試行履歴一覧をページネーション付きで取得する
   */
  async findByUserIdWithPagination(
    userId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsResult> {
    this.logger.debug(
      'PersonalizedProgramAttemptsRepository.findByUserIdWithPagination called',
      { userId, options },
    );

    try {
      const client = this.prisma.getClient();

      // 総件数を取得
      const totalCount = await client.personalizedProgramAttempt.count({
        where: { userId },
      });

      // 試行履歴一覧を取得
      const attempts = await client.personalizedProgramAttempt.findMany({
        where: { userId },
        orderBy: options.orderBy || { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      });

      this.logger.log('ユーザー別番組生成試行履歴一覧を取得しました', {
        userId,
        totalCount,
        retrievedCount: attempts.length,
      });

      return {
        attempts,
        totalCount,
      };
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] の番組生成試行履歴一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
        options,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定IDの番組生成試行履歴を取得する
   */
  async findById(id: string): Promise<PersonalizedProgramAttempt | null> {
    this.logger.debug('PersonalizedProgramAttemptsRepository.findById called', {
      id,
    });

    try {
      const client = this.prisma.getClient();

      const attempt = await client.personalizedProgramAttempt.findUnique({
        where: { id },
      });

      if (!attempt) {
        this.logger.warn(`番組生成試行履歴 [${id}] が見つかりませんでした`);
        return null;
      }

      this.logger.log(`番組生成試行履歴 [${id}] を取得しました`);

      return attempt;
    } catch (error) {
      const errorMessage = `番組生成試行履歴 [${id}] の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ダッシュボード用：指定ユーザーIDの番組生成試行履歴一覧を関連データ付きで取得する
   */
  async findByUserIdWithRelationsForDashboard(
    userId: string,
    feedId: string | undefined,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsWithRelationsResult> {
    this.logger.debug(
      'PersonalizedProgramAttemptsRepository.findByUserIdWithRelationsForDashboard called',
      { userId, feedId, options },
    );

    try {
      const client = this.prisma.getClient();

      // WHERE条件を構築
      const whereCondition: any = { userId };
      if (feedId) {
        whereCondition.feedId = feedId;
      }

      // 総件数を取得
      const totalCount = await client.personalizedProgramAttempt.count({
        where: whereCondition,
      });

      // 試行履歴一覧を関連データ付きで取得
      const attempts = await client.personalizedProgramAttempt.findMany({
        where: whereCondition,
        include: {
          feed: {
            select: {
              id: true,
              name: true,
            },
          },
          program: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: options.orderBy || { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      });

      this.logger.log('ダッシュボード用番組生成試行履歴一覧を取得しました', {
        userId,
        feedId,
        totalCount,
        retrievedCount: attempts.length,
      });

      return {
        attempts,
        totalCount,
      };
    } catch (error) {
      const errorMessage = `ユーザー [${userId}] のダッシュボード用番組生成試行履歴一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
        feedId,
        options,
      });
      this.logger.error(error.message, error.stack);
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }
}
