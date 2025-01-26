import type { NuxtApp } from '#app';

/**
 * ヘッドライントピック番組の件数を取得する
 * @param app Nuxtアプリケーション
 * @returns ヘッドライントピック番組の件数
 */
export const useGetHeadlineTopicProgramCount = async (
  app: NuxtApp,
): Promise<number> => {
  console.debug(`useGetHeadlineTopicProgramCount called`);
  const token = app.$config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getProgramResponse
    = await app.$apiV1.getHeadlineTopicProgramsCount(bearerToken);
  const dto = getProgramResponse.data;
  console.log(`ヘッドライントピック番組の件数`, { count: dto.count });
  return dto.count;
};
