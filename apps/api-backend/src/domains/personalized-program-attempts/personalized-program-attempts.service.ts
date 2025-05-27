import { IPersonalizedFeedsRepository } from '@/domains/personalized-feeds/personalized-feeds.repository.interface';
import { IPersonalizedProgramAttemptsRepository } from '@/domains/personalized-program-attempts/personalized-program-attempts.repository.interface';
import {
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAttemptRetrievalError,
} from '@/types/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PersonalizedProgramAttempt } from '@prisma/client';
import { PersonalizedProgramAttemptStatus } from '@tech-post-cast/database';

/**
 * 番組生成試行履歴取得パラメータ
 */
export interface GetProgramAttemptsParams {
  /** フィードID */
  feedId: string;
  /** ユーザーID */
  userId: string;
  /** ページ番号（1から開始） */
  page?: number;
  /** 1ページあたりの件数 */
  limit?: number;
  /** ソート順 */
  orderBy?: {
    createdAt?: 'asc' | 'desc';
  };
}

/**
 * 番組生成試行履歴取得結果
 */
export interface ProgramAttemptsResult {
  /** 番組生成試行履歴 */
  attempts: PersonalizedProgramAttempt[];
  /** 総件数 */
  totalCount: number;
  /** 現在のページ番号 */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 次のページが存在するか */
  hasNextPage: boolean;
  /** 前のページが存在するか */
  hasPreviousPage: boolean;
}

/**
 * 番組生成試行統計情報
 */
export interface ProgramAttemptsStatistics {
  /** 総試行回数 */
  totalAttempts: number;
  /** 成功回数 */
  successCount: number;
  /** スキップ回数 */
  skippedCount: number;
  /** 失敗回数 */
  failedCount: number;
  /** 成功率（%） */
  successRate: number;
  /** 最新の試行日時 */
  lastAttemptDate?: Date;
  /** 最新の成功日時 */
  lastSuccessDate?: Date;
}

@Injectable()
export class PersonalizedProgramAttemptsService {
  private readonly logger = new Logger(PersonalizedProgramAttemptsService.name);

  constructor(
    @Inject('PersonalizedProgramAttemptsRepository')
    private readonly attemptsRepository: IPersonalizedProgramAttemptsRepository,
    @Inject('PersonalizedFeedsRepository')
    private readonly feedsRepository: IPersonalizedFeedsRepository,
  ) {}

  /**
   * 指定フィードの番組生成試行履歴を取得する
   */
  async getProgramAttempts(
    params: GetProgramAttemptsParams,
  ): Promise<ProgramAttemptsResult> {
    this.logger.debug(
      'PersonalizedProgramAttemptsService.getProgramAttempts called',
      {
        params,
      },
    );

    try {
      // フィードの存在確認とユーザー権限チェック
      await this.validateFeedAccess(params.feedId, params.userId);

      // デフォルト値の設定
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      // 番組生成履歴を取得
      const result = await this.attemptsRepository.findByFeedIdWithPagination(
        params.feedId,
        {
          limit,
          offset,
          orderBy: params.orderBy || { createdAt: 'desc' },
        },
      );

      // ページネーション情報を計算
      const totalPages = Math.ceil(result.totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      this.logger.log('フィード別番組生成履歴を取得しました', {
        feedId: params.feedId,
        userId: params.userId,
        totalCount: result.totalCount,
        currentPage: page,
        totalPages,
        retrievedCount: result.attempts.length,
      });

      return {
        attempts: result.attempts,
        totalCount: result.totalCount,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      if (error instanceof PersonalizedFeedNotFoundError) {
        throw error;
      }

      const errorMessage = `フィード [${params.feedId}] の番組生成履歴の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        params,
      });
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定フィードの番組生成試行統計情報を取得する
   */
  async getProgramAttemptsStatistics(
    feedId: string,
    userId: string,
  ): Promise<ProgramAttemptsStatistics> {
    this.logger.debug(
      'PersonalizedProgramAttemptsService.getProgramAttemptsStatistics called',
      { feedId, userId },
    );

    try {
      // フィードの存在確認とユーザー権限チェック
      await this.validateFeedAccess(feedId, userId);

      // 全ての試行履歴を取得（統計計算のため）
      const allAttempts =
        await this.attemptsRepository.findByFeedIdWithPagination(feedId, {
          limit: 1000, // 十分に大きな値を設定
          offset: 0,
          orderBy: { createdAt: 'desc' },
        });

      // 統計情報を計算
      const totalAttempts = allAttempts.totalCount;
      const successCount = allAttempts.attempts.filter(
        (attempt) =>
          attempt.status === PersonalizedProgramAttemptStatus.SUCCESS,
      ).length;
      const skippedCount = allAttempts.attempts.filter(
        (attempt) =>
          attempt.status === PersonalizedProgramAttemptStatus.SKIPPED,
      ).length;
      const failedCount = allAttempts.attempts.filter(
        (attempt) => attempt.status === PersonalizedProgramAttemptStatus.FAILED,
      ).length;

      const successRate =
        totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

      // 最新の試行日時と最新の成功日時を取得
      const lastAttemptDate =
        allAttempts.attempts.length > 0
          ? allAttempts.attempts[0].createdAt
          : undefined;

      const successfulAttempts = allAttempts.attempts.filter(
        (attempt) =>
          attempt.status === PersonalizedProgramAttemptStatus.SUCCESS,
      );
      const lastSuccessDate =
        successfulAttempts.length > 0
          ? successfulAttempts[0].createdAt
          : undefined;

      this.logger.log('フィード別番組生成統計情報を計算しました', {
        feedId,
        userId,
        totalAttempts,
        successCount,
        skippedCount,
        failedCount,
        successRate: Math.round(successRate * 100) / 100,
      });

      return {
        totalAttempts,
        successCount,
        skippedCount,
        failedCount,
        successRate: Math.round(successRate * 100) / 100,
        lastAttemptDate,
        lastSuccessDate,
      };
    } catch (error) {
      if (error instanceof PersonalizedFeedNotFoundError) {
        throw error;
      }

      const errorMessage = `フィード [${feedId}] の番組生成統計情報の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId,
        userId,
      });
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定フィードの番組生成試行履歴件数を取得する
   */
  async getProgramAttemptsCount(
    feedId: string,
    userId: string,
  ): Promise<number> {
    this.logger.debug(
      'PersonalizedProgramAttemptsService.getProgramAttemptsCount called',
      { feedId, userId },
    );

    try {
      // フィードの存在確認とユーザー権限チェック
      await this.validateFeedAccess(feedId, userId);

      // 履歴件数を取得
      const count = await this.attemptsRepository.countByFeedId(feedId);

      this.logger.log('フィード別番組生成履歴件数を取得しました', {
        feedId,
        userId,
        count,
      });

      return count;
    } catch (error) {
      if (error instanceof PersonalizedFeedNotFoundError) {
        throw error;
      }

      const errorMessage = `フィード [${feedId}] の番組生成履歴件数の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId,
        userId,
      });
      throw new PersonalizedProgramAttemptRetrievalError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * フィードの存在確認とユーザーアクセス権限をチェックする
   * @param feedId フィードID
   * @param userId ユーザーID
   * @throws PersonalizedFeedNotFoundError フィードが存在しない、またはアクセス権限がない場合
   */
  private async validateFeedAccess(
    feedId: string,
    userId: string,
  ): Promise<void> {
    this.logger.debug(
      'PersonalizedProgramAttemptsService.validateFeedAccess called',
      { feedId, userId },
    );

    const feed = await this.feedsRepository.findById(feedId);

    if (!feed) {
      const errorMessage = `パーソナライズフィード [${feedId}] が見つかりませんでした`;
      this.logger.warn(errorMessage, { feedId, userId });
      throw new PersonalizedFeedNotFoundError(errorMessage);
    }

    if (feed.userId !== userId) {
      const errorMessage = `パーソナライズフィード [${feedId}] へのアクセス権限がありません`;
      this.logger.warn(errorMessage, {
        feedId,
        userId,
        feedUserId: feed.userId,
      });
      throw new PersonalizedFeedNotFoundError(errorMessage);
    }

    this.logger.debug('フィードアクセス権限チェック完了', {
      feedId,
      userId,
      feedName: feed.name,
    });
  }
}
