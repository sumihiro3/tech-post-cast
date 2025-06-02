import { Prisma } from '@prisma/client';

/**
 * パーソナライズフィードを元に生成された番組の試行履歴のステータス
 */
export enum PersonalizedProgramAttemptStatus {
  /**
   * 成功
   */
  SUCCESS = 'SUCCESS',
  /**
   * スキップ（記事不足等の理由で生成をスキップ）
   */
  SKIPPED = 'SKIPPED',
  /**
   * 失敗（処理エラー等で生成に失敗）
   */
  FAILED = 'FAILED',
}

/**
 * パーソナライズフィードを元に生成された番組の試行履歴の失敗理由
 */
export enum PersonalizedProgramAttemptFailureReason {
  /**
   * 紹介記事数が不足している
   */
  NOT_ENOUGH_POSTS = 'NOT_ENOUGH_POSTS',
  /**
   * アップロードエラー
   */
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  /**
   * 永続化エラー
   */
  PERSISTENCE_ERROR = 'PERSISTENCE_ERROR',
  /**
   * その他
   */
  OTHER = 'OTHER',
}

/**
 * パーソナライズフィードにフィルターグループと関連フィルターを含む型定義
 */
const personalizedFeedWithFilters = Prisma.validator<Prisma.PersonalizedFeedDefaultArgs>()({
  include: {
    filterGroups: {
      include: {
        tagFilters: true,
        authorFilters: true,
        dateRangeFilters: true,
        likesCountFilters: true,
      },
    },
  },
});

/**
 * フィルターグループ、タグフィルター、著者フィルターを含むパーソナライズフィード型
 */
export type PersonalizedFeedWithFilters = Prisma.PersonalizedFeedGetPayload<
  typeof personalizedFeedWithFilters
>;

/**
 * パーソナライズフィード一覧にフィルターグループと関連フィルターを含む型定義
 */
export type PersonalizedFeedsWithFiltersResult = {
  feeds: PersonalizedFeedWithFilters[];
  total: number;
};
