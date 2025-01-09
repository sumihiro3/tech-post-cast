import { HonoEnv } from '@/middlewares/factory';
import { webhook } from '@line/bot-sdk';
import { Context } from 'hono';
import { handleFollowEvent } from './follow-event';
import { handleMessageEvent } from './message-event';
import { handlePostbackEvent } from './postback-event';
import { handleUnfollowEvent } from './unfollow-event';

/**
 * LINE Webhook イベントを処理する
 * @param context Context
 * @param event WebhookEvent
 */
export const handleWebhookEvent = async (
  context: Context<HonoEnv>,
  event: webhook.Event,
): Promise<void> => {
  console.debug(`event-handler.webhook.handleWebhookEvent called`, {
    event,
  });
  try {
    // Event 処理
    switch (event.type) {
      // メッセージイベントの場合
      case 'message':
        await handleMessageEvent(context, event);
        break;
      // ポストバックイベントの場合
      case 'postback':
        await handlePostbackEvent(context, event);
        break;
      // フォローイベントの場合
      case 'follow':
        await handleFollowEvent(context, event);
        break;
      // フォロー解除イベントの場合
      case 'unfollow':
        await handleUnfollowEvent(context, event);
        break;
      default:
        console.warn(`未対応のイベントタイプです`, {
          event,
        });
        break;
    }
    console.log(`Webhook イベントの処理が完了しました`, { event });
    return;
  } catch (error) {
    console.error(`LINE Webhook イベント処理中にエラーが発生しました`, {
      error,
    });
    // TODO エラーハンドリング
    throw error;
  }
};
