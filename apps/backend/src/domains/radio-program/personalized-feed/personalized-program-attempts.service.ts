import {
  IPersonalizedProgramAttemptsRepository,
  ProgramGenerationStats,
} from '@domains/radio-program/personalized-feed/personalized-program-attempts.repository.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  getStartOfDay,
  subtractDays,
  TIME_ZONE_JST,
} from '@tech-post-cast/commons';

@Injectable()
export class PersonalizedProgramAttemptsService {
  private readonly logger = new Logger(PersonalizedProgramAttemptsService.name);

  constructor(
    @Inject('PersonalizedProgramAttemptsRepository')
    private readonly attemptsRepository: IPersonalizedProgramAttemptsRepository,
  ) {}

  /**
   * 指定日の番組生成統計を取得する
   * @param daysAgo 要求日からの過去日数（デフォルト: 0）
   * @returns 番組生成統計データ
   */
  async getGenerationStatsByDaysAgo(
    daysAgo: number = 0,
  ): Promise<ProgramGenerationStats> {
    this.logger.debug(
      'PersonalizedProgramAttemptsService.getGenerationStatsByDaysAgo called',
      { daysAgo },
    );

    try {
      // 対象日を計算
      const targetDate = getStartOfDay(
        subtractDays(new Date(), daysAgo),
        TIME_ZONE_JST,
      );

      this.logger.debug('番組生成統計取得対象日', {
        targetDate: targetDate.toISOString(),
        daysAgo,
      });

      // リポジトリから統計を取得
      const stats =
        await this.attemptsRepository.getGenerationStatsByDate(targetDate);

      this.logger.log('番組生成統計を取得しました', {
        totalFeeds: stats.totalFeeds,
        successCount: stats.successCount,
        skippedCount: stats.skippedCount,
        failedCount: stats.failedFeedIds.length,
        targetDate: targetDate.toISOString(),
        daysAgo,
      });

      return stats;
    } catch (error) {
      const errorMessage = `番組生成統計の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        daysAgo,
      });
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      throw error;
    }
  }
}
