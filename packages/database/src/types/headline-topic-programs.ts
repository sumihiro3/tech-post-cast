import { Prisma } from '@prisma/client';

/**
 * HeadlineTopicProgram に QiitaPosts を含む型の定義
 * bodyフィールドのみ egress 節約のため除外
 * https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types
 */
const headlineTopicProgramWithQiitaPosts =
  Prisma.validator<Prisma.HeadlineTopicProgramDefaultArgs>()({
    include: {
      posts: {
        select: {
          id: true,
          title: true,
          url: true,
          likesCount: true,
          stocksCount: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          authorName: true,
          private: true,
          refreshedAt: true,
          summary: true,
          headlineTopicProgramId: true,
          tags: true,
          // bodyフィールドのみ Neon Database の egress 節約のため除外
          // body: true,
        },
      },
    },
  });

/**
 * HeadlineTopicProgram に QiitaPosts を含む型
 */
export type HeadlineTopicProgramWithQiitaPosts = Prisma.HeadlineTopicProgramGetPayload<
  typeof headlineTopicProgramWithQiitaPosts
>;
