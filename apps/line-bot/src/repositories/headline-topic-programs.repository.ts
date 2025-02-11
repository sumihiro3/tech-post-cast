import { PrismaClient } from '@prisma/client';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';

/**
 * 最新のヘッドライントピック番組を取得する
 * @param prisma PrismaClient
 * @returns ヘッドライントピック番組
 */
export const findLatest = async (
  prisma: PrismaClient,
): Promise<HeadlineTopicProgramWithQiitaPosts | null> => {
  console.debug(`headline-topic-programs-repository.findLatest called`);
  const result = await prisma.headlineTopicProgram.findFirst({
    where: {
      audioUrl: {
        not: undefined,
      },
    },
    orderBy: {
      createdAt: 'desc',
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

/**
 * 指定IDのヘッドライントピック番組を取得する
 * @param prisma PrismaClient
 * @param id ヘッドライントピック番組ID
 * @returns ヘッドライントピック番組
 */
export const findById = async (
  prisma: PrismaClient,
  id: string,
): Promise<HeadlineTopicProgramWithQiitaPosts | null> => {
  console.debug(`headline-topic-programs-repository.findById called`, {
    id,
  });
  const result = await prisma.headlineTopicProgram.findUnique({
    where: {
      id,
    },
    include: {
      posts: true,
    },
  });
  console.debug(`ヘッドライントピック番組を取得しました`, {
    result,
  });
  return result;
};
