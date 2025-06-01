/**
 * サブスクリプションプラン名の型定義
 */
export type SubscriptionPlanName = 'Free' | 'Basic' | 'Pro' | 'Enterprise';

/**
 * プラン別の色定義
 */
export const SUBSCRIPTION_PLAN_COLORS = {
  Free: 'grey',
  Basic: 'blue',
  Pro: 'purple',
  Enterprise: 'orange',
} as const;

/**
 * プラン別の機能可用性を判定するヘルパー関数
 */
export const getSubscriptionFeatures = () => {
  return {
    personalizedFeedCreation: true, // 全プランで利用可能
    dailyDelivery: true, // 初期リリースでは日次配信機能を追加
    // 初期リリースでは配信機能は実装しないため削除
    // weeklyDelivery: true,
    // monthlyDelivery: planName !== 'Free',
    // advancedFiltering: advancedPlans.includes(planName),
    // apiAccess: planName === 'Enterprise',
  };
};
