import {
  GetDashboardPersonalizedFeedsSummaryResponseDto,
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  PersonalizedFeedSummaryDto,
  PersonalizedProgramSummaryDto,
} from '@/controllers/dashboard/dto';
import { IPersonalizedProgramsRepository } from '@/domains/personalized-programs/personalized-programs.repository.interface';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly personalizedFeedsRepository: PersonalizedFeedsRepository,
    @Inject('PersonalizedProgramsRepository')
    private readonly personalizedProgramsRepository: IPersonalizedProgramsRepository,
  ) {}

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
