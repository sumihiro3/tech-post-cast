import type { GetDashboardSubscriptionResponseDto } from '@/api';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

interface UseDashboardSubscriptionReturn {
  subscription: Ref<GetDashboardSubscriptionResponseDto | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  planDisplayName: ComputedRef<string>;
  planColorClass: ComputedRef<string>;
  usageWarnings: ComputedRef<
    Array<{ label: string; percentage: number; level: 'warning' | 'danger' }>
  >;
}

export function useDashboardSubscription(): UseDashboardSubscriptionReturn {
  const { $dashboardApi } = useNuxtApp();

  // 状態管理
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const subscription = ref<GetDashboardSubscriptionResponseDto | null>(null);

  // サブスクリプション情報を取得
  const fetchSubscription = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const response = await $dashboardApi.getDashboardSubscription();
      subscription.value = response.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error('サブスクリプション情報の取得に失敗しました');
      console.error('Failed to fetch dashboard subscription:', err);
    } finally {
      loading.value = false;
    }
  };

  // プラン表示名
  const planDisplayName = computed<string>(() => {
    if (!subscription.value) return '';
    return subscription.value.planName;
  });

  // プランカラークラス
  const planColorClass = computed<string>(() => {
    if (!subscription.value) return 'grey';
    return subscription.value.planColor;
  });

  // 使用量警告の計算
  const usageWarnings = computed<
    Array<{ label: string; percentage: number; level: 'warning' | 'danger' }>
  >(() => {
    if (!subscription.value) return [];

    return subscription.value.usageItems
      .map((item) => {
        const percentage = (item.current / item.limit) * 100;
        if (percentage >= item.dangerThreshold) {
          return { label: item.label, percentage, level: 'danger' as const };
        } else if (percentage >= item.warningThreshold) {
          return { label: item.label, percentage, level: 'warning' as const };
        }
        return null;
      })
      .filter(Boolean) as Array<{ label: string; percentage: number; level: 'warning' | 'danger' }>;
  });

  // 初回データ取得
  fetchSubscription();

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscription,
    planDisplayName,
    planColorClass,
    usageWarnings,
  };
}
