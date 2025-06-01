import type { NuxtApp } from '#app';
import type { DashboardApi, PersonalizedProgramSummaryDto } from '@/api';

/**
 * パーソナルプログラム一覧を取得する
 * @param app Nuxtアプリケーション
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @returns パーソナルプログラム一覧
 */
export const useGetPersonalizedPrograms = async (
  app: NuxtApp,
  page: number,
  limit: number,
): Promise<PersonalizedProgramSummaryDto[]> => {
  console.debug('useGetPersonalizedPrograms called', { page, limit });

  const offset = (page - 1) * limit;

  const { $dashboardApi } = app;
  const dashboardApi = $dashboardApi as DashboardApi;
  const response = await dashboardApi.getDashboardPersonalizedPrograms(limit, offset);

  const programs = response.data.programs;

  console.debug('useGetPersonalizedPrograms completed', {
    page,
    limit,
    offset,
    programsCount: programs.length,
  });

  return programs;
};
