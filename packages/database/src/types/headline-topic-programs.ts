import { Prisma } from '@prisma/client';

/**
 * HeadlineTopicProgram に QiitaPosts を含む型の定義
 * https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety/operating-against-partial-structures-of-model-types
 */
const headlineTopicProgramWithQiitaPosts =
  Prisma.validator<Prisma.HeadlineTopicProgramDefaultArgs>()({
    include: {
      posts: true,
    },
  });

/**
 * HeadlineTopicProgram に QiitaPosts を含む型
 */
export type HeadlineTopicProgramWithQiitaPosts =
  Prisma.HeadlineTopicProgramGetPayload<typeof headlineTopicProgramWithQiitaPosts>;
