import type { PersonalizedFeedWithFiltersDto, PersonalizedFeedsApi } from '@/api';

interface UseDashboardFeedsOptions {
  autoFetch?: boolean;
}

interface UseDashboardFeedsReturn {
  feeds: Ref<PersonalizedFeedWithFiltersDto[]>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  fetchFeeds: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDashboardFeeds = (
  options: UseDashboardFeedsOptions = {},
): UseDashboardFeedsReturn => {
  const { autoFetch = true } = options;

  // リアクティブな状態
  const feeds = ref<PersonalizedFeedWithFiltersDto[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // APIクライアント
  const { $personalizedFeedApi } = useNuxtApp();
  const personalizedFeedsApi = $personalizedFeedApi as PersonalizedFeedsApi;

  /**
   * フィード一覧を取得
   */
  const fetchFeeds = async (): Promise<void> => {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const response = await personalizedFeedsApi.getPersonalizedFeeds(
        1, // page
        10, // perPage - 最大値100に制限
      );

      feeds.value = response.data.feeds;
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
      error.value = err instanceof Error ? err : new Error('Unknown error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * データを再取得
   */
  const refresh = async (): Promise<void> => {
    await fetchFeeds();
  };

  // 初期データ取得
  if (autoFetch) {
    onMounted(() => {
      fetchFeeds();
    });
  }

  return {
    feeds,
    loading,
    error,
    fetchFeeds,
    refresh,
  };
};
