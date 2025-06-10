import { Prisma } from '@prisma/client';

/**
 * 通知対象のPersonalizedProgramAttemptデータ（ユーザー、フィード、プログラム情報を含む）
 */
const personalizedProgramAttemptWithNotificationData =
  Prisma.validator<Prisma.PersonalizedProgramAttemptDefaultArgs>()({
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
        },
      },
      feed: {
        select: {
          id: true,
          name: true,
        },
      },
      program: {
        select: {
          id: true,
          title: true,
          audioUrl: true,
        },
      },
    },
  });

export type PersonalizedProgramAttemptWithNotificationData =
  Prisma.PersonalizedProgramAttemptGetPayload<
    typeof personalizedProgramAttemptWithNotificationData
  >;
