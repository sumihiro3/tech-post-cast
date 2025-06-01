import type { DashboardApi, PersonalizedProgramSummaryDto } from '@/api';

interface UseDashboardProgramsOptions {
  limit?: number;
  autoFetch?: boolean;
}

interface UseDashboardProgramsReturn {
  programs: Ref<PersonalizedProgramSummaryDto[]>;
  totalCount: Ref<number>;
  currentPage: Ref<number>;
  limit: Ref<number>;
  hasNext: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  fetchPrograms: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDashboardPrograms = (
  options: UseDashboardProgramsOptions = {},
): UseDashboardProgramsReturn => {
  const { limit: defaultLimit = 10, autoFetch = true } = options;

  // リアクティブな状態
  const programs = ref<PersonalizedProgramSummaryDto[]>([]);
  const totalCount = ref(0);
  const currentPage = ref(1);
  const limit = ref(defaultLimit);
  const hasNext = ref(false);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // APIクライアント
  const { $dashboardApi } = useNuxtApp();
  const dashboardApi = $dashboardApi as DashboardApi;

  /**
   * プログラム一覧を取得
   */
  const fetchPrograms = async (page: number = 1): Promise<void> => {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const offset = (page - 1) * limit.value;

      const response = await dashboardApi.getDashboardPersonalizedPrograms(limit.value, offset);

      // 新しいページの場合は置き換え、追加読み込みの場合は追加
      if (page === 1) {
        programs.value = response.data.programs;
      } else {
        programs.value = [...programs.value, ...response.data.programs];
      }

      totalCount.value = response.data.totalCount;
      currentPage.value = page;
      hasNext.value = response.data.hasNext;
    } catch (err) {
      console.error('Failed to fetch programs:', err);
      error.value = err instanceof Error ? err : new Error('Unknown error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 次のページを読み込み（無限スクロール用）
   */
  const loadMore = async (): Promise<void> => {
    if (!hasNext.value || loading.value) return;
    await fetchPrograms(currentPage.value + 1);
  };

  /**
   * データを再取得
   */
  const refresh = async (): Promise<void> => {
    currentPage.value = 1;
    await fetchPrograms(1);
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
    currentPage,
    limit,
    hasNext,
    loading,
    error,
    fetchPrograms,
    loadMore,
    refresh,
  };
};
