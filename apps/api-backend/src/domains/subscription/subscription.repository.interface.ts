import { Plan, Subscription, SubscriptionHistory } from '@prisma/client';
import { SubscriptionInfo, SubscriptionStatus } from '@tech-post-cast/database';

/**
 * プラン制限の型定義
 */
export type PlanLimits = {
  maxFeeds: number;
  maxAuthors: number;
  maxTags: number;
};

/**
 * 現在のサブスクリプション情報の型定義
 */
export type CurrentSubscriptionInfo = {
  subscription: Subscription | null;
  plan: Plan | null;
  status: SubscriptionStatus;
};

/**
 * サブスクリプションリポジトリのインターフェース
 */
export interface ISubscriptionRepository {
  /**
   * ユーザーIDに基づいてサブスクリプションを取得する
   * @param userId - ユーザーID
   * @returns サブスクリプション情報
   */
  findByUserId(userId: string): Promise<SubscriptionInfo | null>;

  /**
   * サブスクリプションの履歴を記録する
   * @param data - サブスクリプション履歴データ
   */
  createSubscriptionHistory(data: {
    subscriptionId: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate?: Date;
  }): Promise<SubscriptionHistory>;

  /**
   * ユーザーの現在のサブスクリプション情報を取得する
   * @param userId - ユーザーID
   * @returns 現在のサブスクリプション情報とプラン情報
   */
  findCurrentSubscription(userId: string): Promise<CurrentSubscriptionInfo>;

  /**
   * ユーザーのプラン制限を取得する
   * @param userId - ユーザーID
   * @returns プランの制限値
   */
  getPlanLimits(userId: string): Promise<PlanLimits>;

  /**
   * 新しいサブスクリプションを作成する
   * @param data - サブスクリプションデータ
   * @returns 作成されたサブスクリプション履歴
   */
  createSubscription(data: {
    userId: string;
    planId: string;
    startDate: Date;
    endDate?: Date;
  }): Promise<SubscriptionHistory>;
}
