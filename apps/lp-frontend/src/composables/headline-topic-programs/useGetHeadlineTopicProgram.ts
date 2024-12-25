// import { useNuxtApp } from '#app';

/**
 * ヘッドライントピック番組を取得する
 */
export default async function useGetHeadlineTopicProgram(programId: string) {
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
