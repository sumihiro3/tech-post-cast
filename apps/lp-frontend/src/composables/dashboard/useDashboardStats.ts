import type { GetDashboardStatsResponseDto } from '@/api';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

interface StatItem {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  clickable?: boolean;
  action?: () => void;
}

interface UseDashboardStatsReturn {
  stats: ComputedRef<StatItem[]>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const { $dashboardApi } = useNuxtApp();

  // 状態管理
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const rawStats = ref<GetDashboardStatsResponseDto | null>(null);

  // 統計データを取得
  const fetchStats = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const response = await $dashboardApi.getDashboardStats();
      rawStats.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('統計情報の取得に失敗しました');
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      loading.value = false;
    }
  };

  // 統計データをStatItem形式に変換
  const stats = computed<StatItem[]>(() => {
    if (!rawStats.value) {
      return [];
    }

    return [
      {
        title: 'アクティブフィード数',
        value: rawStats.value.activeFeedsCount,
        icon: 'mdi-rss',
        color: 'primary',
        subtitle: '※ 現在有効なフィード数',
        clickable: true,
        action: (): void => {
          navigateTo('/app/feeds');
        },
      },
      {
        title: '累計配信数',
        value: rawStats.value.totalEpisodesCount,
        icon: 'mdi-podcast',
        color: 'secondary',
        subtitle: '※ 有効期限切れの番組を含む',
        clickable: true,
        action: (): void => {
          navigateTo('/app/programs');
        },
      },
      {
        title: '累計番組時間',
        value: rawStats.value.totalProgramDuration,
        icon: 'mdi-clock',
        color: 'success',
        subtitle: '※ 有効期限切れの番組を含む',
        clickable: false,
      },
    ];
  });

  // 初回データ取得
  fetchStats();

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
