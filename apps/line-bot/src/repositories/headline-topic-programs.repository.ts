import { PrismaClient } from '@prisma/client';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';

/**
 * 最新のヘッドライントピック番組を取得する
 * @returns ヘッドライントピック番組
 */
export const findLatest = async (
  prisma: PrismaClient,
): Promise<HeadlineTopicProgramWithQiitaPosts | null> => {
  console.debug(`HeadlineTopicProgramsRepository.findLatest called`);
  const result = await prisma.headlineTopicProgram.findFirst({
    where: {
      AND: {
        videoUrl: {
          not: undefined,
        },
        audioUrl: {
          not: undefined,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      posts: true,
    },
  });
  console.debug(`最新のヘッドライントピック番組を取得しました`, {
    result,
  });
  return result;
};
