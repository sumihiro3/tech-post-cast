import { Prisma } from '@prisma/client';

/**
 * サブスクリプションのステータス
 */
export enum SubscriptionStatus {
  /**
   * 有効
   */
  ACTIVE = 'ACTIVE',
  /**
   * 期限切れ
   */
  EXPIRED = 'EXPIRED',
  /**
   * 過去の支払いがあり、支払いが遅れている
   */
  PAST_DUE = 'PAST_DUE',
  /**
   * キャンセル済み
   */
  CANCELED = 'CANCELED',
  /**
   * トライアル中
   */
  TRIALING = 'TRIALING',
  /**
   * 支払いが不完全
   */
  INCOMPLETE = 'INCOMPLETE',
  /**
   * 未購入
   */
  NONE = 'NONE',
}

/**
 * ユーザーとサブスクリプション情報を含む型定義
 */
const userWithSubscription = Prisma.validator<Prisma.AppUserDefaultArgs>()({
  include: {
    subscriptions: {
      where: {
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        startDate: 'desc',
      },
      take: 1,
    },
  },
});

/**
 * ユーザーとサブスクリプション情報を含む型
 */
export type UserWithSubscription = Prisma.AppUserGetPayload<typeof userWithSubscription>;

/**
 * サブスクリプション情報の型
 */
export type SubscriptionInfo = {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  plan?: {
    id: string;
    name: string;
    price: number;
    description: string;
    maxFeeds: number;
    maxAuthors: number;
    maxTags: number;
  };
};

/**
 * ユーザーとサブスクリプション情報の結果型
 */
export type UserWithSubscriptionResult = {
  user: UserWithSubscription;
  subscription: SubscriptionInfo;
};
