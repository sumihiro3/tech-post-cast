import type { NuxtApp } from '#app';
import { useGetHeadlineTopicProgramCount } from './useGetHeadlineTopicProgramCount';

/**
 * ヘッドライントピック番組一覧の最大ページ数を取得する
 * @param app Nuxtアプリケーション
 * @returns ヘッドライントピック番組一覧の最大ページ数
 */
export const useGetHeadlineTopicProgramPageCount = async (
  app: NuxtApp,
): Promise<number> => {
  console.debug(`useGetHeadlineTopicProgramPageCount called`);
  // ヘッドライントピック番組の登録件数を取得する
  const count = await useGetHeadlineTopicProgramCount(app);
  // ヘッドライントピック番組一覧の最大ページ数を計算する
  const programsPerPage = Number(app.$config.public.programsPerPage);
  const pages = Math.ceil(count / programsPerPage);
  console.log(`ヘッドライントピック番組一覧の最大ページ数`, {
    programCount: count,
    perPagePrograms: programsPerPage,
    pages,
  });
  return pages;
};
