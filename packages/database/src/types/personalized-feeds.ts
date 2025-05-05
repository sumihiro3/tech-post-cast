import { Prisma } from '@prisma/client';

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
