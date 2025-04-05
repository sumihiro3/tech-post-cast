import type { NuxtApp } from '#app';
import type { HeadlineTopicProgramDto } from '@/api';

/**
 * ヘッドライントピック番組を取得する
 * @param app Nuxtアプリケーション
 * @param programId 番組ID
 * @returns ヘッドライントピック番組
 */
export const useGetHeadlineTopicProgram = async (
  app: NuxtApp,
  programId: string,
): Promise<HeadlineTopicProgramDto> => {
  console.debug(`useGetHeadlineTopicProgram called`, { programId });
  const token = app.$config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getProgramResponse = await app.$programContentApi.getHeadlineTopicProgram(
    programId,
    bearerToken,
  );
  const dto = getProgramResponse.data;
  console.log(`ヘッドライントピック番組`, { programId, title: dto.title });
  return dto;
};
