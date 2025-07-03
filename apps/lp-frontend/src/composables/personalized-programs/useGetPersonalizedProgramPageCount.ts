import type { NuxtApp } from '#app';
import type { DashboardApi } from '@/api';

/**
 * パーソナルプログラム一覧ページの最大ページ数を取得する
 * @param app Nuxtアプリケーション
 * @returns 最大ページ数
 */
export const useGetPersonalizedProgramPageCount = async (app: NuxtApp): Promise<number> => {
  console.debug('useGetPersonalizedProgramPageCount called');

  const limit = Number(app.$config.public.programsPerPage) || 10;

  // 総件数を取得するために1件だけ取得
  const { $dashboardApi } = app;
  const dashboardApi = $dashboardApi as DashboardApi;
  const response = await dashboardApi.getDashboardPersonalizedPrograms(1, 0);

  const totalCount = response.data.totalCount;
  const pages = Math.ceil(totalCount / limit);

  console.debug('useGetPersonalizedProgramPageCount completed', {
    totalCount,
    limit,
    pages,
  });

  return pages;
};
