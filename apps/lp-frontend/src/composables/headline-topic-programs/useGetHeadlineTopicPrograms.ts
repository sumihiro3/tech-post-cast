import type { NuxtApp } from '#app';
import type { HeadlineTopicProgramDto } from '@/api';

/**
 * ヘッドライントピック番組の一覧を取得する
 * @param app Nuxtアプリケーション
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @returns ヘッドライントピック番組の一覧
 */
export const useGetHeadlineTopicPrograms = async (
  app: NuxtApp,
  page: number,
  limit: number,
): Promise<HeadlineTopicProgramDto[]> => {
  console.debug(`useGetHeadlineTopicPrograms called`, { page, limit });
  // const { $apiV1, $config } = useNuxtApp();
  const token = app.$config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getProgramsResponse = await app.$apiV1.getHeadlineTopicPrograms(
    limit,
    bearerToken,
    page,
  );
  const dtoList = getProgramsResponse.data;
  if (!dtoList) {
    console.error(`ヘッドライントピック番組の一覧を取得できませんでした`);
    return [];
  }
  console.log(`ヘッドライントピック番組の一覧`, {
    page,
    limit,
    count: dtoList.length,
  });
  return dtoList;
};
