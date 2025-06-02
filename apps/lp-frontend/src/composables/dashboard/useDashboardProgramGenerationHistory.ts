import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { ProgramGenerationHistoryDto } from '~/api';
import { useSnackbar } from '~/composables/useSnackbar';

// 番組情報の型定義
interface ProgramInfo {
  id: string;
  title: string;
  expiresAt: string | null;
  isExpired: boolean;
}

interface UseDashboardProgramGenerationHistoryReturn {
  // 状態
  isLoading: Ref<boolean>;
  history: Ref<ProgramGenerationHistoryDto[]>;
  totalCount: Ref<number>;
  currentPage: Ref<number>;
  itemsPerPage: Ref<number>;
  selectedFeedId: Ref<string | undefined>;

  // 計算プロパティ
  totalPages: ComputedRef<number>;
  hasNextPage: ComputedRef<boolean>;
  hasPreviousPage: ComputedRef<boolean>;
  offset: ComputedRef<number>;

  // メソッド
  fetchHistory: () => Promise<void>;
  changePage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setFeedFilter: (feedId: string | undefined) => void;
  clearFilters: () => void;
  refresh: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDateTime: (dateString: string) => string;
  isProgramLinkEnabled: (program: ProgramGenerationHistoryDto['program']) => boolean;
  formatExpirationDate: (dateString: string | null) => string;
  getProgramExpiresAt: (program: ProgramGenerationHistoryDto['program']) => string | null;
}

/**
 * 番組生成履歴の管理を行うコンポーザブル関数
 */
export const useDashboardProgramGenerationHistory =
  (): UseDashboardProgramGenerationHistoryReturn => {
    // API クライアント
    const { $dashboardApi } = useNuxtApp();
    const { showError } = useSnackbar();

    // 状態管理
    const isLoading = ref(false);
    const history = ref<ProgramGenerationHistoryDto[]>([]);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const itemsPerPage = ref(20);
    const selectedFeedId = ref<string | undefined>(undefined);

    // ページネーション計算
    const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value));
    const hasNextPage = computed(() => currentPage.value < totalPages.value);
    const hasPreviousPage = computed(() => currentPage.value > 1);
    const offset = computed(() => (currentPage.value - 1) * itemsPerPage.value);

    /**
     * 番組生成履歴を取得
     */
    const fetchHistory = async (): Promise<void> => {
      try {
        isLoading.value = true;

        const response = await $dashboardApi.getDashboardProgramGenerationHistory(
          selectedFeedId.value,
          itemsPerPage.value,
          offset.value,
        );

        history.value = response.data.history;
        totalCount.value = response.data.totalCount;
      } catch (error) {
        console.error('番組生成履歴の取得に失敗しました:', error);
        showError('番組生成履歴の取得に失敗しました');
        history.value = [];
        totalCount.value = 0;
      } finally {
        isLoading.value = false;
      }
    };

    /**
     * ページを変更
     */
    const changePage = (page: number): void => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };

    /**
     * 次のページに移動
     */
    const nextPage = (): void => {
      if (hasNextPage.value) {
        changePage(currentPage.value + 1);
      }
    };

    /**
     * 前のページに移動
     */
    const previousPage = (): void => {
      if (hasPreviousPage.value) {
        changePage(currentPage.value - 1);
      }
    };

    /**
     * フィードフィルターを設定
     */
    const setFeedFilter = (feedId: string | undefined): void => {
      selectedFeedId.value = feedId;
      currentPage.value = 1; // フィルター変更時はページをリセット
    };

    /**
     * フィルターをクリア
     */
    const clearFilters = (): void => {
      selectedFeedId.value = undefined;
      currentPage.value = 1;
    };

    /**
     * データをリフレッシュ
     */
    const refresh = (): void => {
      fetchHistory();
    };

    // ページまたはフィルターが変更されたら自動で再取得
    watch([currentPage, selectedFeedId], () => {
      fetchHistory();
    });

    /**
     * ステータスに応じた表示色を取得
     */
    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'SUCCESS':
          return 'success';
        case 'SKIPPED':
          return 'warning';
        case 'FAILED':
          return 'error';
        default:
          return 'default';
      }
    };

    /**
     * ステータスに応じた表示テキストを取得
     */
    const getStatusText = (status: string): string => {
      switch (status) {
        case 'SUCCESS':
          return '成功';
        case 'SKIPPED':
          return 'スキップ';
        case 'FAILED':
          return '失敗';
        default:
          return '不明';
      }
    };

    /**
     * 日時をフォーマット
     */
    const formatDateTime = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    /**
     * プログラムリンクが有効かどうかを判定
     */
    const isProgramLinkEnabled = (program: ProgramGenerationHistoryDto['program']): boolean => {
      // programがnullの場合（生成失敗時）はリンク無効
      if (!program) return false;

      // 型アサーションを使用してプログラム情報にアクセス
      const programInfo = program as ProgramInfo;

      // isExpiredフラグがtrueの場合はリンク無効
      if (programInfo.isExpired) return false;

      // 有効期限が設定されていない場合は有効
      if (!programInfo.expiresAt) return true;

      // 現在時刻と有効期限を比較
      const now = new Date();
      const expirationDate = new Date(programInfo.expiresAt);
      return expirationDate > now;
    };

    /**
     * プログラムの有効期限をフォーマット
     */
    const formatExpirationDate = (dateString: string | null): string => {
      if (!dateString) return '期限なし';
      const date = new Date(dateString);
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days > 0) {
        return `期限まであと${days}日`;
      } else {
        return '期限切れ';
      }
    };

    /**
     * プログラムの有効期限を取得
     */
    const getProgramExpiresAt = (
      program: ProgramGenerationHistoryDto['program'],
    ): string | null => {
      if (!program) return null;

      // 型アサーションを使用してプログラム情報にアクセス
      const programInfo = program as ProgramInfo;

      return programInfo.expiresAt;
    };

    return {
      // 状態
      isLoading,
      history,
      totalCount,
      currentPage,
      itemsPerPage,
      selectedFeedId,

      // 計算プロパティ
      totalPages,
      hasNextPage,
      hasPreviousPage,
      offset,

      // メソッド
      fetchHistory,
      changePage,
      nextPage,
      previousPage,
      setFeedFilter,
      clearFilters,
      refresh,
      getStatusColor,
      getStatusText,
      formatDateTime,
      isProgramLinkEnabled,
      formatExpirationDate,
      getProgramExpiresAt,
    };
  };
