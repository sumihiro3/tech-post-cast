import type { NuxtApp } from '#app';
import type { HeadlineTopicProgramWithSimilarAndNeighborsDto } from '@/api';

/**
 * 指定のヘッドライントピック番組と、その類似番組および、前後の日付の番組を取得する
 * @param app Nuxtアプリケーション
 * @param programId 番組ID
 * @returns 指定のヘッドライントピック番組と、その類似番組および、前後の日付の番組
 */
export const useGetHeadlineTopicProgramWithSimilarAndNeighbors = async (
  app: NuxtApp,
  programId: string,
): Promise<HeadlineTopicProgramWithSimilarAndNeighborsDto> => {
  console.debug(`useGetHeadlineTopicProgramWithSimilarAndNeighbors called`, { programId });
  const token = app.$config.public.apiAccessToken;
  const bearerToken = `Bearer ${token}`;
  const getProgramResponse
    = await app.$programContentApi.getHeadlineTopicProgramWithSimilarAndNeighbors(
      programId,
      bearerToken,
    );
  const dto = getProgramResponse.data;
  console.log(`ヘッドライントピック番組`, {
    similar: dto.similar.map(s => ({ id: s.id, title: s.title, createdAt: s.createdAt })),
    previous: {
      id: dto.previous?.id,
      title: dto.previous?.title,
      createdAt: dto.previous?.createdAt,
    },
    target: { id: dto.target.id, title: dto.target.title, createdAt: dto.target.createdAt },
    next: { id: dto.next?.id, title: dto.next?.title, createdAt: dto.next?.createdAt },
  });
  return dto;
};
