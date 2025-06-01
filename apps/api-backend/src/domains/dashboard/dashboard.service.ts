import { AppConfigService } from '@/app-config/app-config.service';
import {
  GetDashboardPersonalizedProgramDetailResponseDto,
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  GetDashboardStatsResponseDto,
  GetDashboardSubscriptionResponseDto,
  PersonalizedProgramSummaryDto,
  ProgramChapterDto,
  ProgramPostDto,
  SubscriptionFeatureDto,
  UsageItemDto,
} from '@/controllers/dashboard/dto';
import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import { IPersonalizedProgramsRepository } from '@/domains/personalized-programs/personalized-programs.repository.interface';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  getSubscriptionFeatures,
  SUBSCRIPTION_PLAN_COLORS,
  SubscriptionPlanName,
} from '@tech-post-cast/commons';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly personalizedFeedsRepository: PersonalizedFeedsRepository,
    @Inject('PersonalizedProgramsRepository')
    private readonly personalizedProgramsRepository: IPersonalizedProgramsRepository,
    @Inject('AppUsersRepository')
    private readonly appUsersRepository: IAppUsersRepository,
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
      // ユーザーの存在確認
      const user = await this.appUsersRepository.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

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

      // 総配信番組数を取得（有効期限切れの番組も含む）
      const allPrograms =
        await this.personalizedProgramsRepository.findAllByUserIdForStats(
          userId,
          {
            limit: 1000, // 大きなページサイズで全件取得
            offset: 0,
            orderBy: { createdAt: 'desc' },
          },
        );

      // 総配信番組数（有効期限切れの番組も含む）
      const totalEpisodesCount = allPrograms.programs.length;

      // 総番組時間を計算（有効期限切れの番組も含む）
      const totalDurationMs = allPrograms.programs
        .filter((program) => program.audioUrl) // 音声ファイルが存在する番組のみ
        .reduce((total, program) => total + (program.audioDuration || 0), 0);

      // ミリ秒を時間単位に変換してフォーマット
      const totalProgramDuration = this.formatDuration(totalDurationMs);

      const result: GetDashboardStatsResponseDto = {
        activeFeedsCount,
        totalEpisodesCount: totalEpisodesCount,
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

    try {
      // ユーザーの存在確認
      const user = await this.appUsersRepository.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

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

      const result: GetDashboardPersonalizedProgramsResponseDto = {
        programs: programDtos,
        totalCount,
        limit,
        offset,
        hasNext,
      };

      this.logger.debug('DashboardService.getPersonalizedPrograms completed', {
        userId,
        programsCount: result.programs.length,
        totalCount: result.totalCount,
        limit: result.limit,
        offset: result.offset,
        hasNext: result.hasNext,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get personalized programs', {
        userId,
        query,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ダッシュボードサブスクリプション情報を取得する
   */
  async getDashboardSubscription(
    userId: string,
  ): Promise<GetDashboardSubscriptionResponseDto> {
    this.logger.debug('DashboardService.getDashboardSubscription called', {
      userId,
    });

    try {
      // ユーザーのサブスクリプション情報を取得
      const userWithSubscription =
        await this.appUsersRepository.findOneWithSubscription(userId);

      if (!userWithSubscription) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // プラン情報を取得（サブスクリプションがない場合はFreeプランとして扱う）
      let planName: SubscriptionPlanName = 'Free';
      let planColor: string = 'grey'; // Freeプランの色
      let maxFeeds: number;
      let maxTags: number;
      let showUpgradeButton = true;

      if (
        userWithSubscription?.subscription?.plan &&
        userWithSubscription.subscription.plan.id !==
          this.appConfigService.FreePlanId
      ) {
        // 有料プランの場合
        const plan = userWithSubscription.subscription.plan;
        planName = plan.name as SubscriptionPlanName;
        planColor = SUBSCRIPTION_PLAN_COLORS[planName] || 'grey';
        maxFeeds = plan.maxFeeds;
        maxTags = plan.maxTags;
        showUpgradeButton = false; // 有料プランの場合はアップグレードボタンを非表示
      } else {
        // Freeプランの場合、デフォルト値を使用
        // 将来的にはデータベースのFreeプランから取得することも可能
        maxFeeds = 1;
        maxTags = 1;
      }

      // 現在のフィード数を取得
      const feedsResult =
        await this.personalizedFeedsRepository.findByUserIdWithFilters(
          userId,
          1,
          1000, // 大きなページサイズで全件取得
        );
      const activeFeedsCount = feedsResult.feeds.filter(
        (feed) => feed.isActive,
      ).length;

      // タグ数を計算（filterGroupsからtagFiltersを取得）
      const totalTagsCount = feedsResult.feeds.reduce((sum, feed) => {
        if (!feed.filterGroups) return sum;
        return (
          sum +
          feed.filterGroups.reduce((groupSum, group) => {
            return groupSum + (group.tagFilters?.length || 0);
          }, 0)
        );
      }, 0);

      // プラン別の機能定義
      const planFeatures = getSubscriptionFeatures();
      const features: SubscriptionFeatureDto[] = [
        {
          name: 'パーソナルフィード作成',
          available: planFeatures.personalizedFeedCreation,
        },
        { name: '日次配信', available: planFeatures.dailyDelivery },
        // 初期リリースでは以下の機能は実装しないため削除
        // { name: '週次配信', available: planFeatures.weeklyDelivery },
        // { name: '月次配信', available: planFeatures.monthlyDelivery },
        // { name: '高度なフィルタリング', available: planFeatures.advancedFiltering },
        // { name: 'API アクセス', available: planFeatures.apiAccess },
      ];

      // 使用量情報
      const usageItems: UsageItemDto[] = [
        {
          label: 'フィード数',
          current: activeFeedsCount,
          limit: maxFeeds,
          showPercentage: true,
          warningThreshold: 70,
          dangerThreshold: 90,
        },
        {
          label: 'タグ数',
          current: totalTagsCount,
          limit: maxTags,
          showPercentage: true,
          warningThreshold: 70,
          dangerThreshold: 90,
        },
      ];

      const result: GetDashboardSubscriptionResponseDto = {
        planName,
        planColor,
        features,
        usageItems,
        showUpgradeButton,
      };

      this.logger.debug('DashboardService.getDashboardSubscription result', {
        userId,
        planName: result.planName,
        featuresCount: result.features.length,
        usageItemsCount: result.usageItems.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get dashboard subscription', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * パーソナルプログラムの詳細情報を取得する
   */
  async getPersonalizedProgramDetail(
    userId: string,
    programId: string,
  ): Promise<GetDashboardPersonalizedProgramDetailResponseDto> {
    this.logger.debug('DashboardService.getPersonalizedProgramDetail called', {
      userId,
      programId,
    });

    try {
      // ユーザーの存在確認
      const user = await this.appUsersRepository.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // パーソナルプログラムの詳細情報を取得
      const program =
        await this.personalizedProgramsRepository.findById(programId);
      if (!program) {
        throw new NotFoundException(`Program with ID ${programId} not found`);
      }

      // プログラムの所有者確認
      if (program.userId !== userId) {
        throw new NotFoundException(`Program with ID ${programId} not found`);
      }

      // チャプター情報の変換
      const chapters: ProgramChapterDto[] = Array.isArray(program.chapters)
        ? (program.chapters as any[]).map((chapter) => ({
            title: chapter.title || '',
            startTime: chapter.startTime || 0,
            endTime: chapter.endTime || 0,
          }))
        : [];

      // 紹介記事一覧の変換
      const posts: ProgramPostDto[] = program.posts.map((post) => ({
        id: post.id,
        title: post.title,
        url: post.url,
        authorName: post.authorName,
        authorId: post.authorId,
        likesCount: post.likesCount,
        stocksCount: post.stocksCount,
        summary: post.summary,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        private: post.private,
      }));

      const result: GetDashboardPersonalizedProgramDetailResponseDto = {
        id: program.id,
        title: program.title,
        feedId: program.feedId,
        feedName: program.feed.name,
        dataSource: program.feed.dataSource,
        audioUrl: program.audioUrl,
        audioDuration: program.audioDuration,
        imageUrl: program.imageUrl,
        script: program.script as Record<string, any>,
        chapters,
        posts,
        expiresAt: program.expiresAt,
        isExpired: program.isExpired,
        createdAt: program.createdAt,
        updatedAt: program.updatedAt,
      };

      this.logger.debug(
        'DashboardService.getPersonalizedProgramDetail completed',
        {
          userId,
          programId,
          feedId: result.feedId,
          feedName: result.feedName,
          postsCount: result.posts.length,
          chaptersCount: result.chapters.length,
        },
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to get personalized program detail', {
        userId,
        programId,
        error: error.message,
      });
      throw error;
    }
  }
}
