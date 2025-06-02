import type { DashboardApi, PersonalizedProgramSummaryDto } from '@/api';

interface UseDashboardProgramsOptions {
  limit?: number;
  autoFetch?: boolean;
}

interface UseDashboardProgramsReturn {
  programs: Ref<PersonalizedProgramSummaryDto[]>;
  totalCount: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  fetchPrograms: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDashboardPrograms = (
  options: UseDashboardProgramsOptions = {},
): UseDashboardProgramsReturn => {
  const { limit: defaultLimit = 10, autoFetch = true } = options;

  // リアクティブな状態
  const programs = ref<PersonalizedProgramSummaryDto[]>([]);
  const totalCount = ref(0);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // APIクライアント
  const { $dashboardApi } = useNuxtApp();
  const dashboardApi = $dashboardApi as DashboardApi;

  /**
   * プログラム一覧を取得
   */
  const fetchPrograms = async (): Promise<void> => {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const response = await dashboardApi.getDashboardPersonalizedPrograms(defaultLimit, 0);

      programs.value = response.data.programs;
      totalCount.value = response.data.totalCount;
    } catch (err) {
      console.error('Failed to fetch programs:', err);
      error.value = err instanceof Error ? err : new Error('Unknown error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * データを再取得
   */
  const refresh = async (): Promise<void> => {
    await fetchPrograms();
  };

  // 初期データ取得
  if (autoFetch) {
    onMounted(() => {
      fetchPrograms();
    });
  }

  return {
    programs,
    totalCount,
    loading,
    error,
    fetchPrograms,
    refresh,
  };
};
