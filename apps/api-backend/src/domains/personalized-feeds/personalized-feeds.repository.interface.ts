import { DeliveryFrequency, SpeakerMode } from '@prisma/client';
import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
  PersonalizedFeedsResult,
  PersonalizedFeedsWithFiltersResult,
} from './personalized-feeds.entity';

// フィルターグループに関する型定義
export interface CreateFilterGroupParams {
  filterId: string;
  name: string;
  logicType: string;
}

// フィルターグループの更新に関する型定義
export interface UpdateFilterGroupParams {
  id: string;
  name?: string;
  logicType?: string;
}

export interface FilterGroup {
  id: string;
  filterId: string;
  name: string;
  logicType: string;
  createdAt: Date;
  updatedAt: Date;
}

// タグフィルターに関する型定義
export interface CreateTagFilterParams {
  groupId: string;
  tagName: string;
}

export interface TagFilter {
  id: string;
  groupId: string;
  tagName: string;
  createdAt: Date;
}

// 著者フィルターに関する型定義
export interface CreateAuthorFilterParams {
  groupId: string;
  authorId: string;
}

export interface AuthorFilter {
  id: string;
  groupId: string;
  authorId: string;
}

// 公開日フィルターに関する型定義
export interface CreateDateRangeFilterParams {
  groupId: string;
  daysAgo: number;
}

export interface DateRangeFilter {
  id: string;
  groupId: string;
  daysAgo: number;
  createdAt: Date;
}

// いいね数フィルターに関する型定義
export interface CreateLikesCountFilterParams {
  groupId: string;
  minLikes: number;
}

export interface LikesCountFilter {
  id: string;
  groupId: string;
  minLikes: number;
  createdAt: Date;
}

// フィードとフィルターグループの作成に関する型定義
export interface CreateFeedWithFilterGroupParams {
  feed: Omit<PersonalizedFeed, 'id' | 'createdAt' | 'updatedAt'>;
  filterGroup?: {
    name: string;
    logicType: string;
    tagFilters?: Array<{ tagName: string }>;
    authorFilters?: Array<{ authorId: string }>;
    dateRangeFilters?: Array<{ daysAgo: number }>;
    likesCountFilters?: Array<{ minLikes: number }>;
  };
}

// パーソナライズフィードの更新に関する型定義
export interface UpdateFeedParams {
  id: string;
  name?: string;
  dataSource?: string;
  filterConfig?: Record<string, any>;
  deliveryConfig?: Record<string, any>;
  deliveryFrequency?: DeliveryFrequency;
  speakerMode?: SpeakerMode;
  isActive?: boolean;
}

// フィードとフィルターグループの更新に関する型定義
export interface UpdateFeedWithFilterGroupParams {
  feed: UpdateFeedParams;
  filterGroup?: {
    name: string;
    logicType: string;
    tagFilters?: Array<{ tagName: string }>;
    authorFilters?: Array<{ authorId: string }>;
    dateRangeFilters?: Array<{ daysAgo: number }>;
    likesCountFilters?: Array<{ minLikes: number }>;
  };
}

export interface FeedWithFilterGroupResult {
  feed: PersonalizedFeed;
  filterGroup?: FilterGroup;
  tagFilters?: TagFilter[];
  authorFilters?: AuthorFilter[];
  dateRangeFilters?: DateRangeFilter[];
  likesCountFilters?: LikesCountFilter[];
}

/**
 * パーソナライズフィードリポジトリのインターフェース
 */
export interface IPersonalizedFeedsRepository {
  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   */
  findByUserId(
    userId: string,
    page?: number,
    perPage?: number,
  ): Promise<PersonalizedFeedsResult>;

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの数を取得する
   * @param userId ユーザーID
   * @returns パーソナライズフィードの数
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧をフィルター情報付きで取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns フィルター情報を含むパーソナライズフィード一覧と総件数
   */
  findByUserIdWithFilters(
    userId: string,
    page?: number,
    perPage?: number,
  ): Promise<PersonalizedFeedsWithFiltersResult>;

  /**
   * 指定されたIDのパーソナライズフィードを取得する
   * @param id パーソナライズフィードID
   * @returns パーソナライズフィード、存在しない場合はnull
   */
  findById(id: string): Promise<PersonalizedFeed | null>;

  /**
   * 指定されたIDのパーソナライズフィードをフィルター情報付きで取得する
   * @param id パーソナライズフィードID
   * @returns フィルター情報を含むパーソナライズフィード、存在しない場合はnull
   */
  findByIdWithFilters(id: string): Promise<PersonalizedFeedWithFilters | null>;

  /**
   * パーソナライズフィードを新規作成する
   * @param feed 作成するパーソナライズフィードの情報
   * @returns 作成されたパーソナライズフィード
   */
  create(
    feed: Omit<PersonalizedFeed, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PersonalizedFeed>;

  /**
   * フィルターグループを新規作成する
   * @param params フィルターグループ作成パラメータ
   * @returns 作成されたフィルターグループ
   */
  createFilterGroup(params: CreateFilterGroupParams): Promise<FilterGroup>;

  /**
   * タグフィルターを新規作成する
   * @param params タグフィルター作成パラメータ
   * @returns 作成されたタグフィルター
   */
  createTagFilter(params: CreateTagFilterParams): Promise<TagFilter>;

  /**
   * 著者フィルターを新規作成する
   * @param params 著者フィルター作成パラメータ
   * @returns 作成された著者フィルター
   */
  createAuthorFilter(params: CreateAuthorFilterParams): Promise<AuthorFilter>;

  /**
   * 公開日フィルターを新規作成する
   * @param params 公開日フィルター作成パラメータ
   * @returns 作成された公開日フィルター
   */
  createDateRangeFilter(
    params: CreateDateRangeFilterParams,
  ): Promise<DateRangeFilter>;

  /**
   * パーソナライズフィードとフィルターグループを同一トランザクションで作成する
   * @param params フィードとフィルターグループの作成パラメータ
   * @returns 作成されたフィードとフィルターグループ
   */
  createWithFilterGroup(
    params: CreateFeedWithFilterGroupParams,
  ): Promise<FeedWithFilterGroupResult>;

  /**
   * パーソナライズフィードを更新する
   * @param feed 更新するパーソナライズフィードの情報
   * @returns 更新されたパーソナライズフィード
   */
  update(feed: UpdateFeedParams): Promise<PersonalizedFeed>;

  /**
   * フィルターグループを更新する
   * @param params 更新するフィルターグループの情報
   * @returns 更新されたフィルターグループ
   */
  updateFilterGroup(params: UpdateFilterGroupParams): Promise<FilterGroup>;

  /**
   * 特定のフィルターグループに紐づくタグフィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除されたタグフィルターの数
   */
  deleteTagFiltersByGroupId(groupId: string): Promise<number>;

  /**
   * 特定のフィルターグループに紐づく著者フィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除された著者フィルターの数
   */
  deleteAuthorFiltersByGroupId(groupId: string): Promise<number>;

  /**
   * 特定のフィルターグループに紐づく公開日フィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除された公開日フィルターの数
   */
  deleteDateRangeFiltersByGroupId(groupId: string): Promise<number>;

  /**
   * いいね数フィルターを新規作成する
   * @param params いいね数フィルター作成パラメータ
   * @returns 作成されたいいね数フィルター
   */
  createLikesCountFilter(
    params: CreateLikesCountFilterParams,
  ): Promise<LikesCountFilter>;

  /**
   * 特定のフィルターグループに紐づくいいね数フィルターをすべて削除する
   * @param groupId フィルターグループID
   * @returns 削除されたいいね数フィルターの数
   */
  deleteLikesCountFiltersByGroupId(groupId: string): Promise<number>;

  /**
   * パーソナライズフィードとフィルターグループを同一トランザクションで更新する
   * @param params フィードとフィルターグループの更新パラメータ
   * @returns 更新されたフィードとフィルターグループ
   */
  updateWithFilterGroup(
    params: UpdateFeedWithFilterGroupParams,
  ): Promise<FeedWithFilterGroupResult>;

  /**
   * パーソナライズフィードを論理削除する
   * @param id パーソナライズフィードID
   * @returns 削除されたパーソナライズフィード
   */
  softDelete(id: string): Promise<PersonalizedFeed>;
}
