import {
  AuthorFilter,
  DateRangeFilter,
  FilterGroup,
  LikesCountFilter,
  PersonalizedFeed,
  TagFilter,
} from './personalized-feeds.entity';

/**
 * フィルターグループパラメータ型
 * - フィルターグループエンティティをベースにした作成・更新用のパラメータ
 */
export type FilterGroupParams = Omit<
  FilterGroup,
  | 'id'
  | 'filterId'
  | 'createdAt'
  | 'updatedAt'
  | 'tagFilters'
  | 'authorFilters'
  | 'dateRangeFilters'
  | 'likesCountFilters'
> & {
  tagFilters?: Pick<TagFilter, 'tagName'>[];
  authorFilters?: Pick<AuthorFilter, 'authorId'>[];
  dateRangeFilters?: Pick<DateRangeFilter, 'daysAgo'>[];
  likesCountFilters?: Pick<LikesCountFilter, 'minLikes'>[];
};

/**
 * パーソナライズフィード作成パラメータ型
 * - PersonalizedFeedエンティティをベースにした作成用のパラメータ
 */
export type CreatePersonalizedFeedParams = Omit<
  PersonalizedFeed,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
> & {
  filterGroups?: FilterGroupParams[];
};

/**
 * パーソナライズフィード更新パラメータ型
 * - PersonalizedFeedエンティティをベースにした更新用のパラメータ
 * - IDは必須、その他の項目はオプショナル
 */
export type UpdatePersonalizedFeedParams = {
  id: string;
} & Partial<
  Omit<PersonalizedFeed, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
    filterGroups?: FilterGroupParams[];
  };

/**
 * パーソナライズフィード更新パラメータかどうかをチェック
 * @param params パラメータ
 * @returns パーソナライズフィード更新パラメータかどうか
 */
export function isUpdatePersonalizedFeedParams(
  params: CreatePersonalizedFeedParams | UpdatePersonalizedFeedParams,
): params is UpdatePersonalizedFeedParams {
  return 'id' in params && typeof params.id === 'string';
}
