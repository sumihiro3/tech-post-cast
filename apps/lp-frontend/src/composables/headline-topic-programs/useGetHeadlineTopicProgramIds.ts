/**
 * ヘッドライントピック番組の番組ID一覧を取得する
 * @returns ヘッドライントピック番組の番組ID一覧
 */
export default async function useGetHeadlineTopicProgramIds(): Promise<
  string[]
> {
  console.debug(`useGetHeadlineTopicProgramIds called`);
  const { $apiV1, $config } = useNuxtApp();
  const token = $config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getCountResponse = await $apiV1.getHeadlineTopicProgramIds(bearerToken);
  const programIds = getCountResponse.data;

  // const programIds = [];
  // for (let page = 1; page <= Math.ceil(programCount / pageLimit); page++) {
  //   const getProgramsResponse = await $apiV1.getHeadlineTopicProgramList(
  //     token,
  //     {
  //       limit: pageLimit,
  //       page,
  //     },
  //   );
  //   const programList = getProgramsResponse.data;
  //   programIds.push(...programList.map((p: HeadlineTopicProgramDto) => p.id));
  // }
  return programIds;
}
