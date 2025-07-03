import { FilterGroupDto } from '@/controllers/personalized-feeds/dto/create-personalized-feed.request.dto';
import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import {
  PersonalizedFeedCreationLimitError,
  PersonalizedFeedError,
  UserNotFoundError,
} from '@/types/errors';
import {
  ISubscriptionRepository,
  PlanLimits,
} from '@domains/subscription/subscription.repository.interface';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { SubscriptionInfo, SubscriptionStatus } from '@tech-post-cast/database';
import {
  PersonalizedFeed,
  PersonalizedFeedsResult,
  PersonalizedFeedsWithFiltersResult,
  PersonalizedFeedWithFilters,
} from './personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';
import {
  CreatePersonalizedFeedParams,
  isUpdatePersonalizedFeedParams,
  UpdatePersonalizedFeedParams,
} from './personalized-feeds.types';

@Injectable()
export class PersonalizedFeedsService {
  private readonly logger = new Logger(PersonalizedFeedsService.name);

  constructor(
    @Inject('PersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
    @Inject('AppUsersRepository')
    private readonly appUserRepository: IAppUsersRepository,
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * 論理削除されたレコード（isActive=false）は除外する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsResult> {
    this.logger.debug('PersonalizedFeedsService.findByUserId', {
      userId,
      page,
      perPage,
    });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);
    // ユーザーのパーソナライズフィード一覧を取得する（有効なもののみ）
    return this.personalizedFeedsRepository.findByUserId(
      user.id,
      page,
      perPage,
    );
  }

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧をフィルター情報付きで取得する
   * 論理削除されたレコード（isActive=false）は除外する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns フィルター情報を含むパーソナライズフィード一覧と総件数
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async findByUserIdWithFilters(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsWithFiltersResult> {
    this.logger.debug('PersonalizedFeedsService.findByUserIdWithFilters', {
      userId,
      page,
      perPage,
    });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);
    // フィルター情報を含むパーソナライズフィード一覧を取得（有効なもののみ）
    return this.personalizedFeedsRepository.findByUserIdWithFilters(
      user.id,
      page,
      perPage,
    );
  }

  /**
   * 指定されたIDのパーソナライズフィードを取得する
   * ただし、指定されたユーザーIDに紐づくフィードのみ取得可能
   * 論理削除されたレコード（isActive=false）は取得できない
   * @param id パーソナライズフィードID
   * @param userId ユーザーID
   * @returns パーソナライズフィード
   * @throws NotFoundException フィードが存在しない場合や論理削除されている場合
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async findById(id: string, userId: string): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsService.findById', { id, userId });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);
    const feed = await this.personalizedFeedsRepository.findById(id);

    // フィードが存在しない場合はエラー
    if (!feed) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }

    // 無効なフィード（論理削除済み）の場合はエラー
    if (!feed.isActive) {
      throw new NotFoundException(
        `パーソナラライズフィード [${id}] は存在しません`,
      );
    }

    // 認証済みユーザーのフィードのみアクセス可能
    if (feed.userId !== user.id) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }
    return feed;
  }

  /**
   * 指定されたIDのパーソナライズフィードをフィルター情報付きで取得する
   * ただし、指定されたユーザーIDに紐づくフィードのみ取得可能
   * 論理削除されたレコード（isActive=false）は取得できない
   * @param id パーソナライズフィードID
   * @param userId ユーザーID
   * @returns フィルター情報を含むパーソナライズフィード
   * @throws NotFoundException フィードが存在しない場合や論理削除されている場合
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async findByIdWithFilters(
    id: string,
    userId: string,
  ): Promise<PersonalizedFeedWithFilters> {
    this.logger.debug('PersonalizedFeedsService.findByIdWithFilters', {
      id,
      userId,
    });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);
    const feed = await this.personalizedFeedsRepository.findByIdWithFilters(id);

    // フィードが存在しない場合はエラー
    if (!feed) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }

    // 無効なフィード（論理削除済み）の場合はエラー
    if (!feed.isActive) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }

    // 認証済みユーザーのフィードのみアクセス可能
    if (feed.userId !== user.id) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }
    return feed;
  }

  /**
   * ユーザーのパーソナライズフィードを新規作成する
   * @param userId ユーザーID
   * @param params パーソナライズフィードの作成パラメータ
   * @param subscription ユーザーのサブスクリプション情報
   * @returns フィルター情報を含む作成されたパーソナライズフィード
   * @throws UserNotFoundError ユーザーが存在しない場合
   * @throws PersonalizedFeedCreationLimitError 制限に達している場合
   */
  async create(
    userId: string,
    params: CreatePersonalizedFeedParams,
    subscription: SubscriptionInfo,
  ): Promise<PersonalizedFeedWithFilters> {
    this.logger.debug('PersonalizedFeedsService.create called', {
      userId,
      params,
      subscription,
    });
    // UIでは1つのフィルターグループのみをサポート
    const filterGroup =
      params.filterGroups && params.filterGroups.length > 0
        ? params.filterGroups[0]
        : undefined;
    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);

    try {
      // ユーザーのサブスクリプション状態に応じたパーソナライズフィードの作成制限をチェック
      await this.checkFeedCreationLimits(user, subscription, params);

      // パーソナライズフィードとフィルターグループをトランザクションで作成
      const result =
        await this.personalizedFeedsRepository.createWithFilterGroup({
          feed: {
            name: params.name,
            userId: user.id,
            dataSource: params.dataSource,
            filterConfig: params.filterConfig,
            deliveryConfig: params.deliveryConfig,
            deliveryFrequency: params.deliveryFrequency,
            speakerMode: params.speakerMode,
            isActive: params.isActive ?? true,
          },
          filterGroup: filterGroup
            ? {
                name: filterGroup.name,
                logicType: filterGroup.logicType || 'OR',
                tagFilters: filterGroup.tagFilters,
                authorFilters: filterGroup.authorFilters,
                dateRangeFilters: filterGroup.dateRangeFilters,
                likesCountFilters: filterGroup.likesCountFilters,
              }
            : undefined,
        });

      this.logger.log(
        `ユーザー [${userId}] のパーソナライズフィード [${result.feed.id}] を新規作成しました`,
        {
          feedId: result.feed.id,
          userId,
          name: params.name,
          deliveryFrequency: params.deliveryFrequency,
          hasFilterGroup: !!result.filterGroup,
          filterGroupId: result.filterGroup?.id,
          tagFiltersCount: result.tagFilters?.length || 0,
          authorFiltersCount: result.authorFilters?.length || 0,
          dateRangeFiltersCount: result.dateRangeFilters?.length || 0,
        },
      );

      // 作成したフィードにフィルター情報を含めて返す
      const feedWithFilters: PersonalizedFeedWithFilters = {
        ...result.feed,
        filterGroups: result.filterGroup
          ? [
              {
                ...result.filterGroup,
                tagFilters: (result.tagFilters || []).map((tagFilter) => ({
                  ...tagFilter,
                  createdAt: tagFilter.createdAt || new Date(),
                })),
                authorFilters: (result.authorFilters || []).map(
                  (authorFilter) => ({
                    ...authorFilter,
                    createdAt: new Date(),
                  }),
                ),
                dateRangeFilters: (result.dateRangeFilters || []).map(
                  (dateRangeFilter) => ({
                    ...dateRangeFilter,
                    createdAt: dateRangeFilter.createdAt || new Date(),
                  }),
                ),
                likesCountFilters: (result.likesCountFilters || []).map(
                  (likesCountFilter) => ({
                    ...likesCountFilter,
                    createdAt: likesCountFilter.createdAt || new Date(),
                  }),
                ),
              },
            ]
          : [],
      };

      return feedWithFilters;
    } catch (error) {
      this.logger.error(`パーソナライズフィードの作成に失敗しました`, {
        error,
        userId,
        name: params.name,
      });
      throw error;
    }
  }

  /**
   * パーソナライズフィードを更新する
   * @param userId ユーザーID
   * @param params 更新するパーソナライズフィードのパラメータ
   * @returns フィルター情報を含む更新されたパーソナライズフィード
   * @throws NotFoundException フィードが存在しない場合
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async update(
    userId: string,
    params: UpdatePersonalizedFeedParams,
    subscription: SubscriptionInfo,
  ): Promise<PersonalizedFeedWithFilters> {
    this.logger.debug('PersonalizedFeedsService.update', {
      userId,
      params,
      subscription,
      hasFilterGroups: params.filterGroups && params.filterGroups.length > 0,
    });

    // UIでは1つのフィルターグループのみをサポート
    const filterGroup =
      params.filterGroups && params.filterGroups.length > 0
        ? params.filterGroups[0]
        : undefined;

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);

    // 現在のフィードを取得して存在確認
    const existingFeed = await this.findById(params.id, userId);

    try {
      // ユーザーのサブスクリプション状態に応じたパーソナライズフィードの作成制限をチェック
      await this.checkFeedCreationLimits(user, subscription, params);
      // パーソナライズフィードとフィルターグループをトランザクションで更新
      const result =
        await this.personalizedFeedsRepository.updateWithFilterGroup({
          feed: {
            id: params.id,
            name: params.name,
            dataSource: params.dataSource,
            filterConfig: params.filterConfig,
            deliveryConfig: params.deliveryConfig,
            deliveryFrequency: params.deliveryFrequency,
            speakerMode: params.speakerMode,
            isActive: params.isActive,
          },
          filterGroup: filterGroup
            ? {
                name: filterGroup.name,
                logicType: filterGroup.logicType || 'OR',
                tagFilters: filterGroup.tagFilters,
                authorFilters: filterGroup.authorFilters,
                dateRangeFilters: filterGroup.dateRangeFilters,
                likesCountFilters: filterGroup.likesCountFilters,
              }
            : undefined,
        });

      this.logger.log(
        `ユーザー [${userId}] のパーソナライズフィード [${params.id}] を更新しました`,
        {
          feedId: params.id,
          userId,
          updates: {
            name: params.name,
            dataSource: params.dataSource,
            deliveryFrequency: params.deliveryFrequency,
          },
          hasFilterGroup: !!result.filterGroup,
          filterGroupId: result.filterGroup?.id,
          tagFiltersCount: result.tagFilters?.length || 0,
          authorFiltersCount: result.authorFilters?.length || 0,
          dateRangeFiltersCount: result.dateRangeFilters?.length || 0,
        },
      );

      // isActiveをfalseに設定した場合（論理削除の場合）は、
      // findByIdWithFiltersでは取得できないため、リポジトリから返された結果を整形して返す
      if (params.isActive === false) {
        const feedWithFilters: PersonalizedFeedWithFilters = {
          ...result.feed,
          filterGroups: result.filterGroup
            ? [
                {
                  ...result.filterGroup,
                  tagFilters: (result.tagFilters || []).map((tagFilter) => ({
                    ...tagFilter,
                    createdAt: tagFilter.createdAt || new Date(),
                  })),
                  authorFilters: (result.authorFilters || []).map(
                    (authorFilter) => ({
                      ...authorFilter,
                      createdAt: new Date(),
                    }),
                  ),
                  dateRangeFilters: (result.dateRangeFilters || []).map(
                    (dateRangeFilter) => ({
                      ...dateRangeFilter,
                      createdAt: dateRangeFilter.createdAt || new Date(),
                    }),
                  ),
                  likesCountFilters: (result.likesCountFilters || []).map(
                    (likesCountFilter) => ({
                      ...likesCountFilter,
                      createdAt: likesCountFilter.createdAt || new Date(),
                    }),
                  ),
                },
              ]
            : [],
        };
        return feedWithFilters;
      }

      // それ以外の場合は、更新後のフィードをフィルター情報付きで取得して返す
      return await this.findByIdWithFilters(params.id, userId);
    } catch (error) {
      this.logger.error(`パーソナライズフィードの更新に失敗しました`, {
        error,
        id: params.id,
        userId,
      });
      throw error;
    }
  }

  /**
   * パーソナライズフィードを論理削除する
   * @param id パーソナライズフィードID
   * @param userId ユーザーID
   * @returns 削除されたパーソナライズフィード
   * @throws NotFoundException フィードが存在しない場合
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async delete(id: string, userId: string): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsService.delete', { id, userId });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);

    // 現在のフィードを取得して存在確認とアクセス権確認
    const existingFeed = await this.findById(id, userId);

    try {
      // パーソナライズフィードを論理削除する
      const result = await this.personalizedFeedsRepository.softDelete(id);

      this.logger.log(
        `ユーザー [${userId}] のパーソナライズフィード [${id}] を論理削除しました`,
        {
          feedId: id,
          userId,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`パーソナライズフィードの削除に失敗しました`, {
        error,
        id,
        userId,
      });
      throw error;
    }
  }

  /**
   * フィルターグループを作成する
   * @param feedId パーソナライズフィードID
   * @param group フィルターグループ情報
   */
  private async createFilterGroup(
    feedId: string,
    group: FilterGroupDto,
  ): Promise<void> {
    this.logger.debug('PersonalizedFeedsService.createFilterGroup', {
      feedId,
      group,
    });

    try {
      // フィルターグループを作成
      const createdGroup =
        await this.personalizedFeedsRepository.createFilterGroup({
          filterId: feedId,
          name: group.name,
          logicType: group.logicType || 'OR',
        });

      // タグフィルターを作成
      if (group.tagFilters && group.tagFilters.length > 0) {
        for (const tagFilter of group.tagFilters) {
          await this.personalizedFeedsRepository.createTagFilter({
            groupId: createdGroup.id,
            tagName: tagFilter.tagName,
          });
        }
      }

      // 著者フィルターを作成
      if (group.authorFilters && group.authorFilters.length > 0) {
        for (const authorFilter of group.authorFilters) {
          await this.personalizedFeedsRepository.createAuthorFilter({
            groupId: createdGroup.id,
            authorId: authorFilter.authorId,
          });
        }
      }

      // 公開日フィルターを作成
      if (group.dateRangeFilters && group.dateRangeFilters.length > 0) {
        for (const dateRangeFilter of group.dateRangeFilters) {
          await this.personalizedFeedsRepository.createDateRangeFilter({
            groupId: createdGroup.id,
            daysAgo: dateRangeFilter.daysAgo,
          });
        }
      }

      if (group.likesCountFilters && group.likesCountFilters.length > 0) {
        for (const likesCountFilter of group.likesCountFilters) {
          await this.personalizedFeedsRepository.createLikesCountFilter({
            groupId: createdGroup.id,
            minLikes: likesCountFilter.minLikes,
          });
        }
      }

      this.logger.debug(
        `フィルターグループ [${createdGroup.id}] を作成しました`,
        {
          groupId: createdGroup.id,
          feedId,
          name: group.name,
          tagFiltersCount: group.tagFilters?.length || 0,
          authorFiltersCount: group.authorFilters?.length || 0,
          dateRangeFiltersCount: group.dateRangeFilters?.length || 0,
          likesCountFiltersCount: group.likesCountFilters?.length || 0,
        },
      );
    } catch (error) {
      this.logger.error(`フィルターグループの作成に失敗しました`, {
        error,
        feedId,
        groupName: group.name,
      });
      throw error;
    }
  }

  /**
   * ユーザーが存在するか確認する
   * @param userId ユーザーID
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async validateUserExists(userId: string): Promise<AppUser> {
    try {
      const user = await this.appUserRepository.findOne(userId);
      if (!user) {
        // ユーザーが存在しない場合はエラー
        throw new UserNotFoundError(userId);
      }
      // ユーザーが無効化されている場合もエラー
      if (!user.isActive) {
        throw new UserNotFoundError(
          userId,
          new Error('ユーザーは無効化されています'),
        );
      }
      return user;
    } catch (error) {
      // AppUserRepository からのエラーをラップして再スロー
      if (!(error instanceof UserNotFoundError)) {
        this.logger.error(
          `ユーザー [${userId}] の存在確認に失敗しました`,
          error,
        );
        throw new UserNotFoundError(userId, error);
      }
      throw error;
    }
  }

  /**
   * フィード作成前の制限チェック
   * サブスクリプションの状態に応じて、フィードの作成制限をチェックする
   *
   * @param user ユーザー
   * @param subscription ユーザーのサブスクリプション情報
   * @param params 作成するフィードの情報
   * @throws PersonalizedFeedCreationLimitError 制限に達している場合
   */
  async checkFeedCreationLimits(
    user: AppUser,
    subscription: SubscriptionInfo,
    params: CreatePersonalizedFeedParams | UpdatePersonalizedFeedParams,
  ): Promise<void> {
    this.logger.debug(
      `PersonalizedFeedsService.checkFeedCreationLimits called`,
      {
        user,
        subscription,
        params,
      },
    );

    // アクティブなサブスクリプションがない場合はエラー
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new PersonalizedFeedCreationLimitError(
        'パーソナライズフィードの作成には有効なサブスクリプションが必要です',
      );
    }

    try {
      // プランの制限値を取得
      const limits: PlanLimits = {
        maxFeeds: subscription.plan.maxFeeds,
        maxTags: subscription.plan.maxTags,
        maxAuthors: subscription.plan.maxAuthors,
      };

      // 現在のフィード数を取得
      const currentFeedCount =
        await this.personalizedFeedsRepository.countByUserId(user.id);

      const isUpdate = isUpdatePersonalizedFeedParams(params);
      // ユーザーのサブスクリプションのフィード数の上限をチェックする
      if (
        // 新規作成の場合、作成後に上限を超える場合はエラー
        (!isUpdate && currentFeedCount + 1 > limits.maxFeeds) ||
        // 更新の場合、既に作成されているフィード数が上限に達している場合はエラー
        (isUpdate && currentFeedCount > limits.maxFeeds)
      ) {
        throw new PersonalizedFeedCreationLimitError(
          `フィード作成数の上限（${limits.maxFeeds}）に達しています。プランをアップグレードするか、既存のフィードを削除してください。`,
        );
      }

      // タグ数の制限チェック
      if (
        params.filterGroups &&
        params.filterGroups[0]?.tagFilters &&
        params.filterGroups[0].tagFilters.length > limits.maxTags
      ) {
        throw new PersonalizedFeedCreationLimitError(
          `1つのフィードに設定できるタグ数の上限（${limits.maxTags}）を超えています。タグ数を減らすか、プランをアップグレードしてください。`,
        );
      }

      // 著者数の制限チェック
      if (
        params.filterGroups &&
        params.filterGroups[0]?.authorFilters &&
        params.filterGroups[0].authorFilters.length > limits.maxAuthors
      ) {
        throw new PersonalizedFeedCreationLimitError(
          `1つのフィードに設定できる著者数の上限（${limits.maxAuthors}）を超えています。著者数を減らすか、プランをアップグレードしてください。`,
        );
      }

      this.logger.debug(`フィード作成制限チェック完了 - 制限内です`);
    } catch (error) {
      if (error instanceof PersonalizedFeedCreationLimitError) {
        throw error;
      }
      this.logger.error(
        `フィード作成制限チェック中にエラーが発生しました`,
        error.message,
        error.stack,
      );
      throw new PersonalizedFeedError(
        'パーソナルフィードの作成制限チェック中にエラーが発生しました。しばらく経ってから再度お試しください。',
      );
    }
  }
}
