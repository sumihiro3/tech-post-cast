// import { useNuxtApp } from '#app';
import type { HeadlineTopicProgramDto } from '@/api';

/**
 * ヘッドライントピック番組の番組ID一覧を取得する
 */
export default async function useGetHeadlineTopicProgramIds() {
  console.debug(`useGetHeadlineTopicProgramIds called`);
  const { $apiV1, $config } = useNuxtApp();
  const apiKey = $config.public.apiAccessToken;
  const pageLimit = 10;
  const getCountResponse = await $apiV1.getHeadlineTopicProgramsCount(apiKey);
  const programCount = getCountResponse.data.count;

  const programIds = [];
  for (let page = 1; page <= Math.ceil(programCount / pageLimit); page++) {
    const getProgramsResponse = await $apiV1.getHeadlineTopicProgramList(
      apiKey,
      {
        limit: pageLimit,
        page,
      },
    );
    const programList = getProgramsResponse.data;
    programIds.push(...programList.map((p: HeadlineTopicProgramDto) => p.id));
  }
  return programIds;
}
