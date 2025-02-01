import type { NuxtApp } from '#app';
import type { HeadlineTopicProgramWithNeighborsDto } from '@/api';

/**
 * 指定のヘッドライントピック番組および、前後の日付の番組を取得する
 * @param app Nuxtアプリケーション
 * @param programId 番組ID
 * @returns 指定のヘッドライントピック番組および、前後の日付の番組
 */
export const useGetHeadlineTopicProgramWithNeighbors = async (
  app: NuxtApp,
  programId: string,
): Promise<HeadlineTopicProgramWithNeighborsDto> => {
  console.debug(`useGetHeadlineTopicProgramWithNeighbors called`, { programId });
  const token = app.$config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getProgramResponse = await app.$apiV1.getHeadlineTopicProgramWithNeighbors(
    programId,
    bearerToken,
  );
  const dto = getProgramResponse.data;
  console.log(`ヘッドライントピック番組`, {
    previous: { id: dto.previous?.id, title: dto.previous?.title, createdAt: dto.previous?.createdAt },
    target: { id: dto.target.id, title: dto.target.title, createdAt: dto.target.createdAt },
    next: { id: dto.next?.id, title: dto.next?.title, createdAt: dto.next?.createdAt },
  });
  return dto;
};
