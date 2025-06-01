import type { GetDashboardPersonalizedProgramDetailResponseDto } from '@/api';

interface UseDashboardProgramDetailReturn {
  programDetail: Ref<GetDashboardPersonalizedProgramDetailResponseDto | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  fetchProgramDetail: (programId: string) => Promise<void>;
  clearData: () => void;
  formatDuration: (durationMs: number) => string;
  formatChapterTime: (timeInSeconds: number) => string;
  getRelativeTime: (date: Date | string) => string;
}

/**
 * パーソナルプログラムの詳細情報を管理するコンポーザブル
 */
export const useDashboardProgramDetail = (): UseDashboardProgramDetailReturn => {
  const { $dashboardApi } = useNuxtApp();

  // リアクティブな状態管理
  const programDetail = ref<GetDashboardPersonalizedProgramDetailResponseDto | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * パーソナルプログラムの詳細情報を取得
   */
  const fetchProgramDetail = async (programId: string): Promise<void> => {
    if (!programId) {
      error.value = 'プログラムIDが指定されていません';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await $dashboardApi.getPersonalizedProgramDetail(programId);
      programDetail.value = response.data;
    } catch (err: unknown) {
      console.error('パーソナルプログラム詳細の取得に失敗しました:', err);

      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = err as { response?: { status?: number } };
        if (errorResponse.response?.status === 404) {
          error.value = 'プログラムが見つかりません';
        } else if (errorResponse.response?.status === 401) {
          error.value = '認証が必要です';
        } else {
          error.value = 'プログラム詳細の取得に失敗しました';
        }
      } else {
        error.value = 'プログラム詳細の取得に失敗しました';
      }

      programDetail.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * データをクリア
   */
  const clearData = (): void => {
    programDetail.value = null;
    error.value = null;
    isLoading.value = false;
  };

  /**
   * 音声時間をフォーマット（ミリ秒 → MM:SS）
   */
  const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * チャプター時間をフォーマット（秒 → MM:SS）
   */
  const formatChapterTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * 相対日時を取得
   */
  const getRelativeTime = (date: Date | string): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今日';
    } else if (diffDays === 1) {
      return '昨日';
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}週間前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}ヶ月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
  };

  return {
    // 状態
    programDetail,
    isLoading,
    error,

    // メソッド
    fetchProgramDetail,
    clearData,

    // ユーティリティ
    formatDuration,
    formatChapterTime,
    getRelativeTime,
  };
};
