import type { NuxtApp } from '#app';
import type { PersonalizedProgramSummaryDto } from '@/api';
import { useGetPersonalizedProgramPageCount } from './useGetPersonalizedProgramPageCount';
import { useGetPersonalizedPrograms } from './useGetPersonalizedPrograms';

interface CurrentPagePersonalizedPrograms {
  currentPage: number;
  programs: PersonalizedProgramSummaryDto[];
  pages: number;
}

/**
 * 指定のページで表示するパーソナルプログラムの一覧を取得する
 * @param app Nuxtアプリケーション
 * @param page ページ番号
 * @returns パーソナルプログラムの一覧
 */
export const useGetCurrentPagePersonalizedPrograms = async (
  app: NuxtApp,
  currentPage: number,
): Promise<CurrentPagePersonalizedPrograms> => {
  console.debug('useGetCurrentPagePersonalizedPrograms called', { currentPage });

  // パーソナルプログラム一覧ページの最大ページ数を取得する
  const pages = await useGetPersonalizedProgramPageCount(app);
  if (currentPage < 1 || currentPage > pages) {
    console.error('指定のページが存在しません', { currentPage, pages });
    throw createError({
      statusCode: 404,
      message: '指定のページが存在しません',
    });
  }

  // 指定ページで表示するパーソナルプログラムの一覧を取得する
  const limit = Number(app.$config.public.programsPerPage) || 10;
  const programs = await useGetPersonalizedPrograms(app, currentPage, limit);

  console.log('指定のページで表示するパーソナルプログラムの一覧', {
    currentPage,
    programs,
    pages,
  });

  return { currentPage, programs, pages };
};
