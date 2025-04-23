import { FilterGroupDto } from '@/controllers/personalized-feeds/dto/create-personalized-feed.request.dto';
import { IAppUserRepository } from '@/domains/app-user/app-user.repository.interface';
import { UserNotFoundError } from '@/types/errors';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
  PersonalizedFeedsResult,
  PersonalizedFeedsWithFiltersResult,
} from './personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';
import {
  CreatePersonalizedFeedParams,
  UpdatePersonalizedFeedParams,
} from './personalized-feeds.types';

@Injectable()
export class PersonalizedFeedsService {
  private readonly logger = new Logger(PersonalizedFeedsService.name);

  constructor(
    @Inject('IPersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
    @Inject('IAppUserRepository')
    private readonly appUserRepository: IAppUserRepository,
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
   * @returns フィルター情報を含む作成されたパーソナライズフィード
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async create(
    userId: string,
    params: CreatePersonalizedFeedParams,
  ): Promise<PersonalizedFeedWithFilters> {
    // UIでは1つのフィルターグループのみをサポート
    const filterGroup =
      params.filterGroups && params.filterGroups.length > 0
        ? params.filterGroups[0]
        : undefined;

    this.logger.debug('PersonalizedFeedsService.create', {
      userId,
      params,
      hasFilterGroup: !!filterGroup,
    });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);

    try {
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
            sortPriority: params.sortPriority,
            isActive: params.isActive ?? true,
          },
          filterGroup: filterGroup
            ? {
                name: filterGroup.name,
                logicType: filterGroup.logicType || 'OR',
                tagFilters: filterGroup.tagFilters,
                authorFilters: filterGroup.authorFilters,
                dateRangeFilters: filterGroup.dateRangeFilters,
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
          sortPriority: params.sortPriority,
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
  ): Promise<PersonalizedFeedWithFilters> {
    this.logger.debug('PersonalizedFeedsService.update', {
      userId,
      params,
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
            sortPriority: params.sortPriority,
            isActive: params.isActive,
          },
          filterGroup: filterGroup
            ? {
                name: filterGroup.name,
                logicType: filterGroup.logicType || 'OR',
                tagFilters: filterGroup.tagFilters,
                authorFilters: filterGroup.authorFilters,
                dateRangeFilters: filterGroup.dateRangeFilters,
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
            sortPriority: params.sortPriority,
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

      this.logger.debug(
        `フィルターグループ [${createdGroup.id}] を作成しました`,
        {
          groupId: createdGroup.id,
          feedId,
          name: group.name,
          tagFiltersCount: group.tagFilters?.length || 0,
          authorFiltersCount: group.authorFilters?.length || 0,
          dateRangeFiltersCount: group.dateRangeFilters?.length || 0,
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
}
