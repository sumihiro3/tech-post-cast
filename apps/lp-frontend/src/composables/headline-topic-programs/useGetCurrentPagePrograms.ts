import type { NuxtApp } from '#app';
import type { CurrentPageHeadlineTopicPrograms } from '@/types';
import { useGetHeadlineTopicProgramPageCount } from './useGetHeadlineTopicProgramPageCount';
import { useGetHeadlineTopicPrograms } from './useGetHeadlineTopicPrograms';

/**
 * 指定のページで表示するヘッドライントピック番組の一覧を取得する
 * @param app Nuxtアプリケーション
 * @param page ページ番号
 * @returns ヘッドライントピック番組の一覧
 */
export const useGetCurrentPagePrograms = async (
  app: NuxtApp,
  currentPage: number,
): Promise<CurrentPageHeadlineTopicPrograms> => {
  console.debug(`useGetCurrentPagePrograms called`, { currentPage });
  // ヘッドライントピック番組一覧ページの最大ページ数を取得する
  const pages = await useGetHeadlineTopicProgramPageCount(app);
  if (currentPage < 1 || currentPage > pages) {
    console.error(`指定のページが存在しません`, { currentPage, pages });
    throw createError({
      statusCode: 404,
      message: '指定のページが存在しません',
    });
  }
  // 指定ページで表示するヘッドライントピック番組の一覧を取得する
  const limit = Number(app.$config.public.programsPerPage) || 10;
  const programs = await useGetHeadlineTopicPrograms(app, currentPage, limit);
  console.log(`指定のページで表示するヘッドライントピック番組の一覧`, {
    currentPage,
    programs,
    pages,
  });
  return { currentPage, programs, pages };
};
