import type { PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum } from '@/api';

/**
 * 配信間隔の表示名を取得する
 * @param frequency 配信間隔
 * @returns 表示名
 */
export const getDeliveryFrequencyLabel = (
  frequency: PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum,
): string => {
  switch (frequency) {
    case 'DAILY':
      return '毎日';
    case 'TWICE_WEEKLY':
      return '週2回';
    case 'WEEKLY':
      return '毎週';
    default:
      return '不明';
  }
};

/**
 * 配信間隔のアイコンを取得する
 * @param frequency 配信間隔
 * @returns アイコン名
 */
export const getDeliveryFrequencyIcon = (
  frequency: PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum,
): string => {
  switch (frequency) {
    case 'DAILY':
      return 'mdi-calendar-today';
    case 'TWICE_WEEKLY':
      return 'mdi-calendar-week';
    case 'WEEKLY':
      return 'mdi-calendar-week-begin';
    default:
      return 'mdi-calendar';
  }
};

/**
 * 配信間隔の色を取得する
 * @param frequency 配信間隔
 * @returns 色名
 */
export const getDeliveryFrequencyColor = (
  frequency: PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum,
): string => {
  switch (frequency) {
    case 'DAILY':
      return 'success';
    case 'TWICE_WEEKLY':
      return 'warning';
    case 'WEEKLY':
      return 'info';
    default:
      return 'grey';
  }
};

/**
 * フィルター設定の型定義（実際のAPIレスポンス構造に対応）
 */
interface FilterConfig {
  // 新しいフィルターグループ構造
  filterGroups?: Array<{
    id?: string;
    name?: string;
    logicType?: string;
    tagFilters?: Array<{
      id?: string;
      tagName: string;
    }>;
    authorFilters?: Array<{
      id?: string;
      authorId: string;
    }>;
    dateRangeFilters?: Array<{
      id?: string;
      daysAgo: number;
    }>;
    likesCountFilters?: Array<{
      id?: string;
      minLikes: number;
    }>;
  }>;

  // 旧形式のフィルター設定（後方互換性のため）
  tags?: string[];
  authors?: string[];
  dateRange?: number;
  likesCount?: number;

  // その他の可能な構造
  filters?: {
    tags?: string[];
    authors?: string[];
    dateRange?: number;
    likesCount?: number;
  };
}

/**
 * PersonalizedFeedWithFiltersDtoの型定義（フィルターグループ情報付き）
 */
interface PersonalizedFeedWithFilters {
  filterGroups?: Array<{
    id?: string;
    name?: string;
    logicType?: string;
    tagFilters?: Array<{
      id?: string;
      tagName: string;
    }>;
    authorFilters?: Array<{
      id?: string;
      authorId: string;
    }>;
    dateRangeFilters?: Array<{
      id?: string;
      daysAgo: number;
    }>;
    likesCountFilters?: Array<{
      id?: string;
      minLikes: number;
    }>;
  }>;
  filterConfig?: object;
}

/**
 * フィルター設定から概要情報を抽出する
 * @param filterConfigOrFeed フィルター設定オブジェクトまたはフィード全体
 * @returns フィルター概要情報
 */
export const extractFilterSummary = (
  filterConfigOrFeed: object,
): {
  tagCount: number;
  authorCount: number;
  hasDateFilter: boolean;
  hasLikesFilter: boolean;
  totalFilters: number;
} => {
  try {
    // デバッグ情報を出力
    if (import.meta.dev) {
      console.log('=== Filter Config Analysis ===');
      console.log('Raw input:', filterConfigOrFeed);
      console.log('Type:', typeof filterConfigOrFeed);
      console.log('Is Array:', Array.isArray(filterConfigOrFeed));
      console.log('Keys:', filterConfigOrFeed ? Object.keys(filterConfigOrFeed) : 'null');
    }

    let tagCount = 0;
    let authorCount = 0;
    let hasDateFilter = false;
    let hasLikesFilter = false;
    let processed = false; // 処理済みフラグ

    // 優先順位1: フィード全体が渡された場合（filterGroupsプロパティを持つ）
    const feedWithFilters = filterConfigOrFeed as PersonalizedFeedWithFilters;
    if (!processed && feedWithFilters.filterGroups && Array.isArray(feedWithFilters.filterGroups)) {
      if (import.meta.dev) {
        console.log('Processing filterGroups from feed:', feedWithFilters.filterGroups);
      }

      feedWithFilters.filterGroups.forEach((group) => {
        if (group.tagFilters && Array.isArray(group.tagFilters)) {
          tagCount += group.tagFilters.length;
          if (import.meta.dev) console.log('Found tagFilters:', group.tagFilters);
        }
        if (group.authorFilters && Array.isArray(group.authorFilters)) {
          authorCount += group.authorFilters.length;
          if (import.meta.dev) console.log('Found authorFilters:', group.authorFilters);
        }
        if (
          group.dateRangeFilters &&
          Array.isArray(group.dateRangeFilters) &&
          group.dateRangeFilters.length > 0
        ) {
          hasDateFilter = true;
          if (import.meta.dev) console.log('Found dateRangeFilters:', group.dateRangeFilters);
        }
        if (
          group.likesCountFilters &&
          Array.isArray(group.likesCountFilters) &&
          group.likesCountFilters.length > 0
        ) {
          hasLikesFilter = true;
          if (import.meta.dev) console.log('Found likesCountFilters:', group.likesCountFilters);
        }
      });
      processed = true;
    }

    // filterConfigの構造を解析（後方互換性のため）
    const config = filterConfigOrFeed as FilterConfig;

    // 優先順位2: 新しいフィルターグループ構造の処理（filterConfigの中にある場合）
    if (!processed && config.filterGroups && Array.isArray(config.filterGroups)) {
      if (import.meta.dev) {
        console.log('Processing filterGroups from config:', config.filterGroups);
      }
      config.filterGroups.forEach((group) => {
        if (group.tagFilters && Array.isArray(group.tagFilters)) {
          tagCount += group.tagFilters.length;
        }
        if (group.authorFilters && Array.isArray(group.authorFilters)) {
          authorCount += group.authorFilters.length;
        }
        if (
          group.dateRangeFilters &&
          Array.isArray(group.dateRangeFilters) &&
          group.dateRangeFilters.length > 0
        ) {
          hasDateFilter = true;
        }
        if (
          group.likesCountFilters &&
          Array.isArray(group.likesCountFilters) &&
          group.likesCountFilters.length > 0
        ) {
          hasLikesFilter = true;
        }
      });
      processed = true;
    }

    // 優先順位3: ネストされたfiltersオブジェクトの処理
    if (!processed && config.filters) {
      if (import.meta.dev) console.log('Processing nested filters:', config.filters);
      if (config.filters.tags && Array.isArray(config.filters.tags)) {
        tagCount += config.filters.tags.length;
      }
      if (config.filters.authors && Array.isArray(config.filters.authors)) {
        authorCount += config.filters.authors.length;
      }
      if (config.filters.dateRange !== undefined && config.filters.dateRange !== null) {
        hasDateFilter = true;
      }
      if (
        config.filters.likesCount !== undefined &&
        config.filters.likesCount !== null &&
        config.filters.likesCount > 0
      ) {
        hasLikesFilter = true;
      }
      processed = true;
    }

    // 優先順位4: 旧形式のフィルター設定への対応（直接プロパティ）
    if (!processed) {
      if (config.tags && Array.isArray(config.tags)) {
        tagCount += config.tags.length;
        if (import.meta.dev) console.log('Found direct tags:', config.tags);
      }
      if (config.authors && Array.isArray(config.authors)) {
        authorCount += config.authors.length;
        if (import.meta.dev) console.log('Found direct authors:', config.authors);
      }
      if (config.dateRange !== undefined && config.dateRange !== null) {
        hasDateFilter = true;
        if (import.meta.dev) console.log('Found direct dateRange:', config.dateRange);
      }
      if (config.likesCount !== undefined && config.likesCount !== null && config.likesCount > 0) {
        hasLikesFilter = true;
        if (import.meta.dev) console.log('Found direct likesCount:', config.likesCount);
      }
      processed = true;
    }

    // その他の可能な構造を探索（デバッグ用）
    if (import.meta.dev) {
      const allKeys = Object.keys(config);
      console.log('All config keys:', allKeys);

      // 未知の構造を探索
      allKeys.forEach((key) => {
        const value = (config as Record<string, unknown>)[key];
        if (value && typeof value === 'object') {
          console.log(`Key "${key}":`, value);
          if (Array.isArray(value)) {
            console.log(`  - Array with ${value.length} items`);
          } else {
            console.log(`  - Object with keys:`, Object.keys(value as Record<string, unknown>));
          }
        }
      });
    }

    const totalFilters =
      tagCount + authorCount + (hasDateFilter ? 1 : 0) + (hasLikesFilter ? 1 : 0);

    const result = {
      tagCount,
      authorCount,
      hasDateFilter,
      hasLikesFilter,
      totalFilters,
    };

    if (import.meta.dev) {
      console.log('Filter summary result:', result);
      console.log('Processed flag:', processed);
      console.log('==============================');
    }

    return result;
  } catch (error) {
    console.warn('Failed to parse filter config:', error);
    return {
      tagCount: 0,
      authorCount: 0,
      hasDateFilter: false,
      hasLikesFilter: false,
      totalFilters: 0,
    };
  }
};

/**
 * 日時を相対的な表示形式に変換する
 * @param dateString ISO日時文字列
 * @returns 相対的な日時表示
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}日前`;
    } else if (diffHours > 0) {
      return `${diffHours}時間前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分前`;
    } else {
      return 'たった今';
    }
  } catch (error) {
    console.warn('Failed to format relative time:', error);
    return '不明';
  }
};

/**
 * フィードのステータスに応じた色を取得する
 * @param isActive 有効フラグ
 * @returns ステータス色
 */
export const getFeedStatusColor = (isActive: boolean): string => {
  return isActive ? 'success' : 'grey';
};

/**
 * フィードのステータステキストを取得する
 * @param isActive 有効フラグ
 * @returns ステータステキスト
 */
export const getFeedStatusText = (isActive: boolean): string => {
  return isActive ? '有効' : '無効';
};
