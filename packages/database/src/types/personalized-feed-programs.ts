import { Prisma } from '@prisma/client';

/**
 * PersonalizedFeedProgram にフィード情報とQiitaPostsを含む型の定義
 * bodyフィールドのみ egress 節約のため除外
 */
const personalizedFeedProgramWithDetails =
  Prisma.validator<Prisma.PersonalizedFeedProgramDefaultArgs>()({
    include: {
      feed: {
        select: {
          id: true,
          name: true,
          dataSource: true,
        },
      },
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
          // bodyフィールドのみ Neon Database の egress 節約のため除外
          // body: true,
        },
      },
    },
  });

/**
 * PersonalizedFeedProgram にフィード情報とQiitaPostsを含む型
 */
export type PersonalizedFeedProgramWithDetails = Prisma.PersonalizedFeedProgramGetPayload<
  typeof personalizedFeedProgramWithDetails
>;
