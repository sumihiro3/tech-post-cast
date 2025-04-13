import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
  PersonalizedFeedsResult,
  PersonalizedFeedsWithFiltersResult,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import {
  AuthorFilter,
  CreateAuthorFilterParams,
  CreateFeedWithFilterGroupParams,
  CreateFilterGroupParams,
  CreateTagFilterParams,
  FeedWithFilterGroupResult,
  FilterGroup,
  IPersonalizedFeedsRepository,
  TagFilter,
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
        };

        this.logger.debug(
          'パーソナライズフィードとフィルターグループを作成しました',
          {
            feedId: result.feed.id,
            userId: result.feed.userId,
            filterGroupId: result.filterGroup?.id,
            tagFiltersCount: result.tagFilters?.length || 0,
            authorFiltersCount: result.authorFilters?.length || 0,
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
}
