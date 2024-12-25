// import { useNuxtApp } from '#app';

import type { HeadlineTopicProgramDto } from '@/api';

/**
 * ヘッドライントピック番組を取得する
 * @param programId 番組ID
 * @returns ヘッドライントピック番組
 */
export default async function useGetHeadlineTopicProgram(
  programId: string,
): Promise<HeadlineTopicProgramDto> {
  console.debug(`useGetHeadlineTopicProgram called`, { programId });
  const { $apiV1, $config } = useNuxtApp();
  const token = $config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getProgramResponse = await $apiV1.getHeadlineTopicProgram(
    programId,
    bearerToken,
  );
  const dto = getProgramResponse.data;
  console.log(`ヘッドライントピック番組`, { programId, title: dto.title });
  return dto;
}
