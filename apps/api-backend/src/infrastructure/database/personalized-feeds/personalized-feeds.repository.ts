import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
  PersonalizedFeedsResult,
  PersonalizedFeedsWithFiltersResult,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import {
  AuthorFilter,
  CreateAuthorFilterParams,
  CreateDateRangeFilterParams,
  CreateFeedWithFilterGroupParams,
  CreateFilterGroupParams,
  CreateTagFilterParams,
  DateRangeFilter,
  FeedWithFilterGroupResult,
  FilterGroup,
  IPersonalizedFeedsRepository,
  TagFilter,
  UpdateFeedWithFilterGroupParams,
  UpdateFilterGroupParams,
} from '@/domains/personalized-feeds/personalized-feeds.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClientManager,
  PersonalizedFeedWithFilters as PrismaPersonalizedFeedWithFilters,
} from '@tech-post-cast/database';

/**
 * IPersonalizedFeedsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class PersonalizedFeedsRepository
  implements IPersonalizedFeedsRepository
{
  private readonly logger = new Logger(PersonalizedFeedsRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsResult> {
    this.logger.debug('PersonalizedFeedsRepository.findByUserId called', {
      userId,
      page,
      perPage,
    });

    try {
      const client = this.prisma.getClient();

      // 総件数を取得
      const total = await client.personalizedFeed.count({
        where: {
          userId,
          isActive: true,
        },
      });

      // ページネーションを適用してフィード一覧を取得
      const skip = (page - 1) * perPage;
      const personalizedFeeds = await client.personalizedFeed.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: perPage,
      });

      // エンティティへ変換
      const feeds = personalizedFeeds.map((feed) => new PersonalizedFeed(feed));

      this.logger.debug('パーソナライズフィード一覧を取得しました', {
        userId,
        totalCount: total,
        retrievedCount: feeds.length,
      });

      return new PersonalizedFeedsResult(feeds, total);
    } catch (error) {
      const errorMessage = `パーソナライズフィード一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
        page,
        perPage,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧をフィルター情報付きで取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns フィルター情報を含むパーソナライズフィード一覧と総件数
   */
  async findByUserIdWithFilters(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsWithFiltersResult> {
    this.logger.debug(
      'PersonalizedFeedsRepository.findByUserIdWithFilters called',
      {
        userId,
        page,
        perPage,
      },
    );

    try {
      const client = this.prisma.getClient();

      // 総件数を取得
      const total = await client.personalizedFeed.count({
        where: {
          userId,
          isActive: true,
        },
      });

      // ページネーションを適用してフィード一覧とフィルター情報を取得
      const skip = (page - 1) * perPage;
      const personalizedFeeds = await client.personalizedFeed.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          filterGroups: {
            include: {
              tagFilters: true,
              authorFilters: true,
              dateRangeFilters: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: perPage,
      });

      // エンティティへ変換
      const feeds = personalizedFeeds.map(
        (feed) =>
          new PersonalizedFeedWithFilters(
            feed as PrismaPersonalizedFeedWithFilters,
          ),
      );

      this.logger.debug(
        'フィルター情報付きのパーソナライズフィード一覧を取得しました',
        {
          userId,
          totalCount: total,
          retrievedCount: feeds.length,
        },
      );

      return new PersonalizedFeedsWithFiltersResult(feeds, total);
    } catch (error) {
      const errorMessage = `フィルター情報付きのパーソナライズフィード一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
        page,
        perPage,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 指定されたIDのパーソナライズフィードを取得する
   * @param id パーソナライズフィードID
   * @returns パーソナライズフィード、存在しない場合はnull
   */
  async findById(id: string): Promise<PersonalizedFeed | null> {
    this.logger.debug('PersonalizedFeedsRepository.findById called', { id });

    try {
      const client = this.prisma.getClient();
      const personalizedFeed = await client.personalizedFeed.findUnique({
        where: { id },
      });

      if (!personalizedFeed) {
        this.logger.debug(`パーソナライズフィード [${id}] は存在しません`);
        return null;
      }

      return new PersonalizedFeed(personalizedFeed);
    } catch (error) {
      const errorMessage = `パーソナライズフィードの取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 指定されたIDのパーソナライズフィードをフィルター情報付きで取得する
   * @param id パーソナライズフィードID
   * @returns フィルター情報を含むパーソナライズフィード、存在しない場合はnull
   */
  async findByIdWithFilters(
    id: string,
  ): Promise<PersonalizedFeedWithFilters | null> {
    this.logger.debug(
      'PersonalizedFeedsRepository.findByIdWithFilters called',
      { id },
    );

    try {
      const client = this.prisma.getClient();
      const personalizedFeed = await client.personalizedFeed.findUnique({
        where: { id },
        include: {
          filterGroups: {
            include: {
              tagFilters: true,
              authorFilters: true,
              dateRangeFilters: true,
            },
          },
        },
      });

      if (!personalizedFeed) {
        this.logger.debug(`パーソナライズフィード [${id}] は存在しません`);
        return null;
      }

      return new PersonalizedFeedWithFilters(
        personalizedFeed as PrismaPersonalizedFeedWithFilters,
      );
    } catch (error) {
      const errorMessage = `フィルター情報付きのパーソナライズフィードの取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * パーソナライズフィードを新規作成する
   * @param feed 作成するパーソナライズフィードの情報
   * @returns 作成されたパーソナライズフィード
   */
  async create(
    feed: Omit<PersonalizedFeed, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsRepository.create called', { feed });

    try {
      const client = this.prisma.getClient();

      // フィードの作成日時と更新日時を現在時刻に設定
      const now = new Date();

      // パーソナライズフィードを作成
      const createdFeed = await client.personalizedFeed.create({
        data: {
          ...feed,
          createdAt: now,
          updatedAt: now,
          // ID は自動生成 (prisma-client-manager で接頭辞付きID生成処理を実装済み)
        },
      });

      this.logger.debug(
        `パーソナライズフィード [${createdFeed.id}] を作成しました`,
        {
          feedId: createdFeed.id,
          userId: createdFeed.userId,
        },
      );

      return new PersonalizedFeed(createdFeed);
    } catch (error) {
      const errorMessage = `パーソナライズフィードの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feed,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * フィルターグループを新規作成する
   * @param params フィルターグループ作成パラメータ
   * @returns 作成されたフィルターグループ
   */
  async createFilterGroup(
    params: CreateFilterGroupParams,
  ): Promise<FilterGroup> {
    this.logger.debug('PersonalizedFeedsRepository.createFilterGroup called', {
      params,
    });

    try {
      const client = this.prisma.getClient();

      // 現在時刻を設定
      const now = new Date();

      // フィルターグループを作成
      const createdGroup = await client.feedFilterGroup.create({
        data: {
          filterId: params.filterId,
          name: params.name,
          logicType: params.logicType,
          createdAt: now,
          updatedAt: now,
        },
      });

      this.logger.debug(
        `フィルターグループ [${createdGroup.id}] を作成しました`,
        {
          groupId: createdGroup.id,
          filterId: createdGroup.filterId,
          name: createdGroup.name,
        },
      );

      return {
        id: createdGroup.id,
        filterId: createdGroup.filterId,
        name: createdGroup.name,
        logicType: createdGroup.logicType,
        createdAt: createdGroup.createdAt,
        updatedAt: createdGroup.updatedAt,
      };
    } catch (error) {
      const errorMessage = `フィルターグループの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        params,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * タグフィルターを新規作成する
   * @param params タグフィルター作成パラメータ
   * @returns 作成されたタグフィルター
   */
  async createTagFilter(params: CreateTagFilterParams): Promise<TagFilter> {
    this.logger.debug('PersonalizedFeedsRepository.createTagFilter called', {
      params,
    });

    try {
      const client = this.prisma.getClient();

      // 現在時刻を設定
      const now = new Date();

      // タグフィルターを作成
      const createdTagFilter = await client.tagFilter.create({
        data: {
          groupId: params.groupId,
          tagName: params.tagName,
          createdAt: now,
        },
      });

      this.logger.debug(
        `タグフィルター [${createdTagFilter.id}] を作成しました`,
        {
          id: createdTagFilter.id,
          groupId: createdTagFilter.groupId,
          tagName: createdTagFilter.tagName,
        },
      );

      return {
        id: createdTagFilter.id,
        groupId: createdTagFilter.groupId,
        tagName: createdTagFilter.tagName,
        createdAt: createdTagFilter.createdAt,
      };
    } catch (error) {
      const errorMessage = `タグフィルターの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        params,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 著者フィルターを新規作成する
   * @param params 著者フィルター作成パラメータ
   * @returns 作成された著者フィルター
   */
  async createAuthorFilter(
    params: CreateAuthorFilterParams,
  ): Promise<AuthorFilter> {
    this.logger.debug('PersonalizedFeedsRepository.createAuthorFilter called', {
      params,
    });

    try {
      const client = this.prisma.getClient();

      // 現在時刻を設定
      const now = new Date();

      // 著者フィルターを作成
      const createdAuthorFilter = await client.authorFilter.create({
        data: {
          groupId: params.groupId,
          authorId: params.authorId,
          createdAt: now,
        },
      });

      this.logger.debug(
        `著者フィルター [${createdAuthorFilter.id}] を作成しました`,
        {
          id: createdAuthorFilter.id,
          groupId: createdAuthorFilter.groupId,
          authorId: createdAuthorFilter.authorId,
        },
      );

      return {
        id: createdAuthorFilter.id,
        groupId: createdAuthorFilter.groupId,
        authorId: createdAuthorFilter.authorId,
      };
    } catch (error) {
      const errorMessage = `著者フィルターの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        params,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 公開日フィルターを新規作成する
   * @param params 公開日フィルター作成パラメータ
   * @returns 作成された公開日フィルター
   */
  async createDateRangeFilter(
    params: CreateDateRangeFilterParams,
  ): Promise<DateRangeFilter> {
    this.logger.debug(
      'PersonalizedFeedsRepository.createDateRangeFilter called',
      {
        params,
      },
    );

    try {
      const client = this.prisma.getClient();

      // 現在時刻を設定
      const now = new Date();

      // 公開日フィルターを作成
      const createdDateRangeFilter = await client.dateRangeFilter.create({
        data: {
          groupId: params.groupId,
          daysAgo: params.daysAgo,
          createdAt: now,
        },
      });

      this.logger.debug(
        `公開日フィルター [${createdDateRangeFilter.id}] を作成しました`,
        {
          id: createdDateRangeFilter.id,
          groupId: createdDateRangeFilter.groupId,
          daysAgo: createdDateRangeFilter.daysAgo,
        },
      );

      return {
        id: createdDateRangeFilter.id,
        groupId: createdDateRangeFilter.groupId,
        daysAgo: createdDateRangeFilter.daysAgo,
        createdAt: createdDateRangeFilter.createdAt,
      };
    } catch (error) {
      const errorMessage = `公開日フィルターの作成に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        params,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 特定のフィルターグループに紐づく公開日フィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除された公開日フィルターの数
   */
  async deleteDateRangeFiltersByGroupId(groupId: string): Promise<number> {
    this.logger.debug(
      'PersonalizedFeedsRepository.deleteDateRangeFiltersByGroupId called',
      {
        groupId,
      },
    );

    try {
      const client = this.prisma.getClient();

      // 特定グループの公開日フィルターをすべて削除
      const result = await client.dateRangeFilter.deleteMany({
        where: { groupId },
      });

      this.logger.debug(
        `フィルターグループ [${groupId}] の公開日フィルターを ${result.count} 件削除しました`,
        {
          groupId,
          count: result.count,
        },
      );

      return result.count;
    } catch (error) {
      const errorMessage = `公開日フィルターの削除に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        groupId,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * パーソナライズフィードとフィルターグループを同一トランザクションで作成する
   * @param params フィードとフィルターグループの作成パラメータ
   * @returns 作成されたフィードとフィルターグループ
   */
  async createWithFilterGroup(
    params: CreateFeedWithFilterGroupParams,
  ): Promise<FeedWithFilterGroupResult> {
    this.logger.debug(
      'PersonalizedFeedsRepository.createWithFilterGroup called',
      {
        feedData: params.feed,
        hasFilterGroup: !!params.filterGroup,
      },
    );

    try {
      // PrismaClientManagerのトランザクション機能を使用
      return await this.prisma.transaction(async () => {
        const client = this.prisma.getClient();
        const now = new Date();

        // パーソナライズフィードを作成
        const createdFeed = await client.personalizedFeed.create({
          data: {
            ...params.feed,
            createdAt: now,
            updatedAt: now,
          },
        });

        // フィルターグループが指定されている場合は作成
        let createdGroup = null;
        const tagFilters = [];
        const authorFilters = [];
        const dateRangeFilters = [];

        if (params.filterGroup) {
          // フィルターグループを作成
          createdGroup = await client.feedFilterGroup.create({
            data: {
              filterId: createdFeed.id,
              name: params.filterGroup.name,
              logicType: params.filterGroup.logicType || 'OR',
              createdAt: now,
              updatedAt: now,
            },
          });

          // タグフィルターを作成
          if (
            params.filterGroup.tagFilters &&
            params.filterGroup.tagFilters.length > 0
          ) {
            for (const tagFilter of params.filterGroup.tagFilters) {
              const createdTagFilter = await client.tagFilter.create({
                data: {
                  groupId: createdGroup.id,
                  tagName: tagFilter.tagName,
                  createdAt: now,
                },
              });
              tagFilters.push({
                id: createdTagFilter.id,
                groupId: createdTagFilter.groupId,
                tagName: createdTagFilter.tagName,
                createdAt: createdTagFilter.createdAt,
              });
            }
          }

          // 著者フィルターを作成
          if (
            params.filterGroup.authorFilters &&
            params.filterGroup.authorFilters.length > 0
          ) {
            for (const authorFilter of params.filterGroup.authorFilters) {
              const createdAuthorFilter = await client.authorFilter.create({
                data: {
                  groupId: createdGroup.id,
                  authorId: authorFilter.authorId,
                  createdAt: now,
                },
              });
              authorFilters.push({
                id: createdAuthorFilter.id,
                groupId: createdAuthorFilter.groupId,
                authorId: createdAuthorFilter.authorId,
              });
            }
          }

          // 公開日フィルターを作成
          if (
            params.filterGroup.dateRangeFilters &&
            params.filterGroup.dateRangeFilters.length > 0
          ) {
            for (const dateRangeFilter of params.filterGroup.dateRangeFilters) {
              const createdDateRangeFilter =
                await client.dateRangeFilter.create({
                  data: {
                    groupId: createdGroup.id,
                    daysAgo: dateRangeFilter.daysAgo,
                    createdAt: now,
                  },
                });
              dateRangeFilters.push({
                id: createdDateRangeFilter.id,
                groupId: createdDateRangeFilter.groupId,
                daysAgo: createdDateRangeFilter.daysAgo,
                createdAt: createdDateRangeFilter.createdAt,
              });
            }
          }
        }

        const result = {
          feed: new PersonalizedFeed(createdFeed),
          filterGroup: createdGroup
            ? {
                id: createdGroup.id,
                filterId: createdGroup.filterId,
                name: createdGroup.name,
                logicType: createdGroup.logicType,
                createdAt: createdGroup.createdAt,
                updatedAt: createdGroup.updatedAt,
              }
            : undefined,
          tagFilters: tagFilters.length > 0 ? tagFilters : undefined,
          authorFilters: authorFilters.length > 0 ? authorFilters : undefined,
          dateRangeFilters:
            dateRangeFilters.length > 0 ? dateRangeFilters : undefined,
        };

        this.logger.debug(
          'パーソナライズフィードとフィルターグループを作成しました',
          {
            feedId: result.feed.id,
            userId: result.feed.userId,
            filterGroupId: result.filterGroup?.id,
            tagFiltersCount: result.tagFilters?.length || 0,
            authorFiltersCount: result.authorFilters?.length || 0,
            dateRangeFiltersCount: result.dateRangeFilters?.length || 0,
          },
        );

        return result;
      });
    } catch (error) {
      const errorMessage = `パーソナライズフィードとフィルターグループの作成に失敗しました`;
      this.logger.error(errorMessage, { error, params });
      throw new Error(errorMessage);
    }
  }

  /**
   * パーソナライズフィードを更新する
   * @param feed 更新するパーソナライズフィードの情報
   * @returns 更新されたパーソナライズフィード
   */
  async update(feed: {
    id: string;
    name?: string;
    dataSource?: string;
    filterConfig?: Record<string, any>;
    deliveryConfig?: Record<string, any>;
    isActive?: boolean;
  }): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsRepository.update called', { feed });

    try {
      const client = this.prisma.getClient();

      // 更新するフィールドを準備
      const updateData: any = {
        updatedAt: new Date(), // 更新日時は必ず現在時刻に設定
      };

      // 指定されたフィールドのみ更新対象に含める
      if (feed.name !== undefined) updateData.name = feed.name;
      if (feed.dataSource !== undefined)
        updateData.dataSource = feed.dataSource;
      if (feed.filterConfig !== undefined)
        updateData.filterConfig = feed.filterConfig;
      if (feed.deliveryConfig !== undefined)
        updateData.deliveryConfig = feed.deliveryConfig;
      if (feed.isActive !== undefined) updateData.isActive = feed.isActive;

      // パーソナライズフィードを更新
      const updatedFeed = await client.personalizedFeed.update({
        where: { id: feed.id },
        data: updateData,
      });

      this.logger.debug(
        `パーソナライズフィード [${updatedFeed.id}] を更新しました`,
        {
          feedId: updatedFeed.id,
          userId: updatedFeed.userId,
          updatedFields: Object.keys(updateData).filter(
            (k) => k !== 'updatedAt',
          ),
        },
      );

      return new PersonalizedFeed(updatedFeed);
    } catch (error) {
      const errorMessage = `パーソナライズフィードの更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId: feed.id,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * フィルターグループを更新する
   * @param params 更新するフィルターグループの情報
   * @returns 更新されたフィルターグループ
   */
  async updateFilterGroup(
    params: UpdateFilterGroupParams,
  ): Promise<FilterGroup> {
    this.logger.debug('PersonalizedFeedsRepository.updateFilterGroup called', {
      params,
    });

    try {
      const client = this.prisma.getClient();

      // 更新するフィールドを準備
      const updateData: any = {
        updatedAt: new Date(), // 更新日時は必ず現在時刻に設定
      };

      // 指定されたフィールドのみ更新対象に含める
      if (params.name !== undefined) updateData.name = params.name;
      if (params.logicType !== undefined)
        updateData.logicType = params.logicType;

      // フィルターグループを更新
      const updatedGroup = await client.feedFilterGroup.update({
        where: { id: params.id },
        data: updateData,
      });

      this.logger.debug(
        `フィルターグループ [${updatedGroup.id}] を更新しました`,
        {
          groupId: updatedGroup.id,
          filterId: updatedGroup.filterId,
          updatedFields: Object.keys(updateData).filter(
            (k) => k !== 'updatedAt',
          ),
        },
      );

      return {
        id: updatedGroup.id,
        filterId: updatedGroup.filterId,
        name: updatedGroup.name,
        logicType: updatedGroup.logicType,
        createdAt: updatedGroup.createdAt,
        updatedAt: updatedGroup.updatedAt,
      };
    } catch (error) {
      const errorMessage = `フィルターグループの更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        groupId: params.id,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 特定のフィルターグループに紐づくタグフィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除されたタグフィルターの数
   */
  async deleteTagFiltersByGroupId(groupId: string): Promise<number> {
    this.logger.debug(
      'PersonalizedFeedsRepository.deleteTagFiltersByGroupId called',
      {
        groupId,
      },
    );

    try {
      const client = this.prisma.getClient();

      // 特定グループのタグフィルターをすべて削除
      const result = await client.tagFilter.deleteMany({
        where: { groupId },
      });

      this.logger.debug(
        `フィルターグループ [${groupId}] のタグフィルターを ${result.count} 件削除しました`,
        {
          groupId,
          count: result.count,
        },
      );

      return result.count;
    } catch (error) {
      const errorMessage = `タグフィルターの削除に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        groupId,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * 特定のフィルターグループに紐づく著者フィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除された著者フィルターの数
   */
  async deleteAuthorFiltersByGroupId(groupId: string): Promise<number> {
    this.logger.debug(
      'PersonalizedFeedsRepository.deleteAuthorFiltersByGroupId called',
      {
        groupId,
      },
    );

    try {
      const client = this.prisma.getClient();

      // 特定グループの著者フィルターをすべて削除
      const result = await client.authorFilter.deleteMany({
        where: { groupId },
      });

      this.logger.debug(
        `フィルターグループ [${groupId}] の著者フィルターを ${result.count} 件削除しました`,
        {
          groupId,
          count: result.count,
        },
      );

      return result.count;
    } catch (error) {
      const errorMessage = `著者フィルターの削除に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        groupId,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * パーソナライズフィードとフィルターグループを同一トランザクションで更新する
   * @param params フィードとフィルターグループの更新パラメータ
   * @returns 更新されたフィードとフィルターグループ
   */
  async updateWithFilterGroup(
    params: UpdateFeedWithFilterGroupParams,
  ): Promise<FeedWithFilterGroupResult> {
    this.logger.debug(
      'PersonalizedFeedsRepository.updateWithFilterGroup called',
      {
        feedId: params.feed.id,
        hasFilterGroup: !!params.filterGroup,
      },
    );

    try {
      // PrismaClientManagerのトランザクション機能を使用
      return await this.prisma.transaction(async () => {
        const client = this.prisma.getClient();
        const now = new Date();

        // 更新するフィールドを準備
        const updateData: any = {
          updatedAt: now,
        };

        // 指定されたフィールドのみ更新対象に含める
        if (params.feed.name !== undefined) updateData.name = params.feed.name;
        if (params.feed.dataSource !== undefined)
          updateData.dataSource = params.feed.dataSource;
        if (params.feed.filterConfig !== undefined)
          updateData.filterConfig = params.feed.filterConfig;
        if (params.feed.deliveryConfig !== undefined)
          updateData.deliveryConfig = params.feed.deliveryConfig;
        if (params.feed.isActive !== undefined)
          updateData.isActive = params.feed.isActive;

        // パーソナライズフィードを更新
        const updatedFeed = await client.personalizedFeed.update({
          where: { id: params.feed.id },
          data: updateData,
        });

        // フィルターグループの処理
        let updatedGroup = null;
        const tagFilters = [];
        const authorFilters = [];
        const dateRangeFilters = [];

        if (params.filterGroup) {
          // 既存のフィルターグループを取得
          const existingGroups = await client.feedFilterGroup.findMany({
            where: { filterId: params.feed.id },
          });

          // 既存のフィルターグループがある場合は更新、なければ新規作成
          if (existingGroups.length > 0) {
            const groupId = existingGroups[0].id; // 最初のグループを使用

            // 既存のタグフィルター、著者フィルター、公開日フィルターを削除
            await this.deleteTagFiltersByGroupId(groupId);
            await this.deleteAuthorFiltersByGroupId(groupId);
            await this.deleteDateRangeFiltersByGroupId(groupId);

            // フィルターグループを更新
            updatedGroup = await client.feedFilterGroup.update({
              where: { id: groupId },
              data: {
                name: params.filterGroup.name,
                logicType: params.filterGroup.logicType || 'OR',
                updatedAt: now,
              },
            });
          } else {
            // フィルターグループを新規作成
            updatedGroup = await client.feedFilterGroup.create({
              data: {
                filterId: params.feed.id,
                name: params.filterGroup.name,
                logicType: params.filterGroup.logicType || 'OR',
                createdAt: now,
                updatedAt: now,
              },
            });
          }

          // 新しいタグフィルターを作成
          if (
            params.filterGroup.tagFilters &&
            params.filterGroup.tagFilters.length > 0
          ) {
            for (const tagFilter of params.filterGroup.tagFilters) {
              const createdTagFilter = await client.tagFilter.create({
                data: {
                  groupId: updatedGroup.id,
                  tagName: tagFilter.tagName,
                  createdAt: now,
                },
              });
              tagFilters.push({
                id: createdTagFilter.id,
                groupId: createdTagFilter.groupId,
                tagName: createdTagFilter.tagName,
                createdAt: createdTagFilter.createdAt,
              });
            }
          }

          // 新しい著者フィルターを作成
          if (
            params.filterGroup.authorFilters &&
            params.filterGroup.authorFilters.length > 0
          ) {
            for (const authorFilter of params.filterGroup.authorFilters) {
              const createdAuthorFilter = await client.authorFilter.create({
                data: {
                  groupId: updatedGroup.id,
                  authorId: authorFilter.authorId,
                  createdAt: now,
                },
              });
              authorFilters.push({
                id: createdAuthorFilter.id,
                groupId: createdAuthorFilter.groupId,
                authorId: createdAuthorFilter.authorId,
              });
            }
          }

          // 新しい公開日フィルターを作成
          if (
            params.filterGroup.dateRangeFilters &&
            params.filterGroup.dateRangeFilters.length > 0
          ) {
            for (const dateRangeFilter of params.filterGroup.dateRangeFilters) {
              const createdDateRangeFilter =
                await client.dateRangeFilter.create({
                  data: {
                    groupId: updatedGroup.id,
                    daysAgo: dateRangeFilter.daysAgo,
                    createdAt: now,
                  },
                });
              dateRangeFilters.push({
                id: createdDateRangeFilter.id,
                groupId: createdDateRangeFilter.groupId,
                daysAgo: createdDateRangeFilter.daysAgo,
                createdAt: createdDateRangeFilter.createdAt,
              });
            }
          }
        }

        const result = {
          feed: new PersonalizedFeed(updatedFeed),
          filterGroup: updatedGroup
            ? {
                id: updatedGroup.id,
                filterId: updatedGroup.filterId,
                name: updatedGroup.name,
                logicType: updatedGroup.logicType,
                createdAt: updatedGroup.createdAt,
                updatedAt: updatedGroup.updatedAt,
              }
            : undefined,
          tagFilters: tagFilters.length > 0 ? tagFilters : undefined,
          authorFilters: authorFilters.length > 0 ? authorFilters : undefined,
          dateRangeFilters:
            dateRangeFilters.length > 0 ? dateRangeFilters : undefined,
        };

        this.logger.debug(
          'パーソナライズフィードとフィルターグループを更新しました',
          {
            feedId: result.feed.id,
            userId: result.feed.userId,
            filterGroupId: result.filterGroup?.id,
            tagFiltersCount: result.tagFilters?.length || 0,
            authorFiltersCount: result.authorFilters?.length || 0,
            dateRangeFiltersCount: result.dateRangeFilters?.length || 0,
            updatedFields: Object.keys(updateData).filter(
              (k) => k !== 'updatedAt',
            ),
          },
        );

        return result;
      });
    } catch (error) {
      const errorMessage = `パーソナライズフィードとフィルターグループの更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        feedId: params.feed.id,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * パーソナライズフィードを論理削除する
   * @param id パーソナライズフィードID
   * @returns 削除されたパーソナライズフィード
   */
  async softDelete(id: string): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsRepository.softDelete called', { id });

    try {
      const client = this.prisma.getClient();

      // isActive=falseに設定して論理削除を行う
      const deletedFeed = await client.personalizedFeed.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`パーソナライズフィード [${id}] を論理削除しました`, {
        feedId: id,
        userId: deletedFeed.userId,
      });

      return new PersonalizedFeed(deletedFeed);
    } catch (error) {
      const errorMessage = `パーソナライズフィードの論理削除に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      throw new Error(errorMessage);
    }
  }
}
