import {
  GetDashboardPersonalizedFeedsSummaryResponseDto,
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  GetDashboardStatsResponseDto,
  PersonalizedFeedSummaryDto,
  PersonalizedProgramSummaryDto,
} from '@/controllers/dashboard/dto';
import { IPersonalizedProgramsRepository } from '@/domains/personalized-programs/personalized-programs.repository.interface';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  TIME_ZONE_JST,
} from '@tech-post-cast/commons';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly personalizedFeedsRepository: PersonalizedFeedsRepository,
    @Inject('PersonalizedProgramsRepository')
    private readonly personalizedProgramsRepository: IPersonalizedProgramsRepository,
  ) {}

  /**
   * ダッシュボード統計情報を取得する
   */
  async getDashboardStats(
    userId: string,
  ): Promise<GetDashboardStatsResponseDto> {
    this.logger.debug('DashboardService.getDashboardStats called', {
      userId,
    });

    try {
      // 現在の月の開始日と終了日を計算（JST）
      const now = new Date();
      const currentMonthStart = getFirstDayOfMonth(now, TIME_ZONE_JST);
      const currentMonthEnd = getLastDayOfMonth(now, TIME_ZONE_JST);

      // アクティブなフィード数を取得
      const feedsResult =
        await this.personalizedFeedsRepository.findByUserIdWithFilters(
          userId,
          1,
          1000, // 大きなページサイズで全件取得
        );
      const activeFeedsCount = feedsResult.feeds.filter(
        (feed) => feed.isActive,
      ).length;

      // 今月の配信番組数を取得（全番組を取得してフィルタリング）
      const allPrograms =
        await this.personalizedProgramsRepository.findByUserIdWithPagination(
          userId,
          {
            limit: 1000, // 大きなページサイズで全件取得
            offset: 0,
            orderBy: { createdAt: 'desc' },
          },
        );

      // 今月作成された番組をフィルタリング
      const monthlyPrograms = allPrograms.programs.filter((program) => {
        const createdAt = new Date(program.createdAt);
        return createdAt >= currentMonthStart && createdAt <= currentMonthEnd;
      });
      const monthlyEpisodesCount = monthlyPrograms.length;

      // 総番組時間を計算（全番組の音声時間を合計）
      const totalDurationMs = allPrograms.programs
        .filter((program) => program.audioUrl) // 音声ファイルが存在する番組のみ
        .reduce((total, program) => total + (program.audioDuration || 0), 0);

      // ミリ秒を時間単位に変換してフォーマット
      const totalProgramDuration = this.formatDuration(totalDurationMs);

      const result: GetDashboardStatsResponseDto = {
        activeFeedsCount,
        monthlyEpisodesCount,
        totalProgramDuration,
      };

      this.logger.debug('DashboardService.getDashboardStats completed', {
        userId,
        result,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get dashboard stats', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 音声時間（ミリ秒）を人間が読みやすい形式にフォーマットする
   * @param durationMs 音声時間（ミリ秒）
   * @returns フォーマット済み文字列（例: "12.5h", "45m"）
   */
  private formatDuration(durationMs: number): string {
    if (durationMs === 0) {
      return '0m';
    }

    const totalMinutes = Math.floor(durationMs / (1000 * 60));

    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    // 30分以上の場合は.5時間として表示
    if (remainingMinutes >= 30) {
      return `${hours}.5h`;
    }

    return `${hours}h`;
  }

  /**
   * パーソナルフィード概要情報を取得する
   */
  async getPersonalizedFeedsSummary(
    userId: string,
  ): Promise<GetDashboardPersonalizedFeedsSummaryResponseDto> {
    this.logger.debug('DashboardService.getPersonalizedFeedsSummary called', {
      userId,
    });

    // ユーザーの全フィードをフィルター情報付きで取得（大きなページサイズで全件取得）
    const feedsResult =
      await this.personalizedFeedsRepository.findByUserIdWithFilters(
        userId,
        1,
        1000,
      );

    // アクティブなフィード数を計算
    const activeFeedsCount = feedsResult.feeds.filter(
      (feed) => feed.isActive,
    ).length;

    // 最近作成されたフィード（最新5件）を取得
    const recentFeeds = feedsResult.feeds
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((feed): PersonalizedFeedSummaryDto => {
        const tagFiltersCount = feed.filterGroups.reduce(
          (count, group) => count + (group.tagFilters?.length || 0),
          0,
        );
        const authorFiltersCount = feed.filterGroups.reduce(
          (count, group) => count + (group.authorFilters?.length || 0),
          0,
        );
        const dateRangeFiltersCount = feed.filterGroups.reduce(
          (count, group) => count + (group.dateRangeFilters?.length || 0),
          0,
        );
        const likesCountFiltersCount = feed.filterGroups.reduce(
          (count, group) => count + (group.likesCountFilters?.length || 0),
          0,
        );

        return {
          id: feed.id,
          name: feed.name,
          description: feed.dataSource, // dataSourceを説明として使用
          isActive: feed.isActive,
          tagFiltersCount,
          authorFiltersCount,
          totalFiltersCount:
            tagFiltersCount +
            authorFiltersCount +
            dateRangeFiltersCount +
            likesCountFiltersCount,
          createdAt: feed.createdAt,
          updatedAt: feed.updatedAt,
        };
      });

    // 総フィルター条件数を計算
    const totalFiltersCount = feedsResult.feeds.reduce((total, feed) => {
      return (
        total +
        feed.filterGroups.reduce((groupTotal, group) => {
          return (
            groupTotal +
            (group.tagFilters?.length || 0) +
            (group.authorFilters?.length || 0) +
            (group.dateRangeFilters?.length || 0) +
            (group.likesCountFilters?.length || 0)
          );
        }, 0)
      );
    }, 0);

    return {
      activeFeedsCount,
      totalFeedsCount: feedsResult.total,
      recentFeeds,
      totalFiltersCount,
    };
  }

  /**
   * パーソナルプログラム一覧を取得する
   */
  async getPersonalizedPrograms(
    userId: string,
    query: GetDashboardPersonalizedProgramsRequestDto,
  ): Promise<GetDashboardPersonalizedProgramsResponseDto> {
    this.logger.debug('DashboardService.getPersonalizedPrograms called', {
      userId,
      query,
    });

    const { limit = 10, offset = 0 } = query;

    // パーソナルプログラム一覧を取得（ページネーション対応）
    const { programs, totalCount } =
      await this.personalizedProgramsRepository.findByUserIdWithPagination(
        userId,
        {
          limit,
          offset,
          orderBy: { createdAt: 'desc' },
        },
      );

    // DTOに変換
    const programDtos: PersonalizedProgramSummaryDto[] = programs.map(
      (program) => ({
        id: program.id,
        title: program.title,
        feedId: program.feedId,
        feedName: program.feed.name,
        audioUrl: program.audioUrl,
        audioDuration: program.audioDuration,
        imageUrl: program.imageUrl,
        postsCount: program.posts.length,
        expiresAt: program.expiresAt,
        isExpired: program.isExpired,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      }),
    );

    const hasNext = offset + limit < totalCount;

    return {
      programs: programDtos,
      totalCount,
      limit,
      offset,
      hasNext,
    };
  }
}
