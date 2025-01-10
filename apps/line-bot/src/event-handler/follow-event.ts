import { HonoEnv } from '@/middlewares/factory';
import {
  LineUserUpsertRequest,
  upsert,
} from '@/repositories/line-users.repository';
import { webhook } from '@line/bot-sdk';
import { Context } from 'hono';

/**
 * フォローイベントを処理する
 * @param context Context
 * @param event FollowEvent
 */
export const handleFollowEvent = async (
  context: Context<HonoEnv>,
  event: webhook.FollowEvent,
): Promise<void> => {
  console.debug(`event-handler.follow-event.handleFollowEvent called`, {
    event,
  });
  // フォローイベントの処理
  const userId = event.source!.userId;
  const timestamp = event.timestamp;
  console.log(`ユーザーがフォローしました`, {
    userId,
    timestamp,
  });
  // LINE User Profile を取得する
  const client = context.var.lineClient;
  const profile = await client.getProfile(userId!);
  const upsertRequest: LineUserUpsertRequest = {
    id: userId!,
    displayName: profile.displayName,
    isFollowed: true,
    followedAt: new Date(timestamp),
    language: profile.language,
    pictureUrl: profile.pictureUrl,
  };
  // LINE USER をフォロー状態に設定する
  const prisma = context.var.prismaClient;
  const user = await upsert(upsertRequest, prisma);
  console.log(`LINE USER をフォロー状態に設定しました`, {
    user,
  });
};
