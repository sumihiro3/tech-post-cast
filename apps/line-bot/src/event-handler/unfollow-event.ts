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
export const handleUnfollowEvent = async (
  context: Context<HonoEnv>,
  event: webhook.UnfollowEvent,
): Promise<void> => {
  console.debug(`event-handler.unfollow-event.handleUnfollowEvent called`, {
    event,
  });
  // フォローイベントの処理
  const userId = event.source!.userId;
  const timestamp = event.timestamp;
  console.log(`ユーザーがフォロー解除しました`, {
    userId,
    timestamp,
  });
  const upsertRequest: LineUserUpsertRequest = {
    id: userId!,
    displayName: '', // フォロー解除時は表示名を空にする
    isFollowed: false,
    pictureUrl: '', // フォロー解除時はプロフィール画像 URL を空にする
  };
  // LINE USER をフォロー解除に設定する
  const prisma = context.var.prismaClient;
  const user = await upsert(upsertRequest, prisma);
  console.log(`LINE USER をフォロー解除に設定しました`, {
    user,
  });
};
