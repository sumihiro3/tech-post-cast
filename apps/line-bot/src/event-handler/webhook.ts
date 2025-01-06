import { webhook } from '@line/bot-sdk';
import { Context } from 'hono';
import { HonoEnv } from '../middlewares/factory';
import { handleMessageEvent } from './message-event';

/**
 * LINE Webhook イベントを処理する
 * @param context Context
 * @param event WebhookEvent
 */
export const handleWebhookEvent = async (
  context: Context<HonoEnv>,
  event: webhook.Event,
): Promise<void> => {
  console.debug(`LineBotService.handleWebhook() called`, {
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
      // case 'postback':
      //   await this.handlePostbackEvent(event);
      //   break;
      default:
        console.warn(`未対応のイベントタイプです`, {
          event,
        });
        break;
    }
    return;
  } catch (error) {
    console.error(`LINE Webhook イベント処理中にエラーが発生しました`, {
      error,
    });
    // TODO エラーハンドリング
    throw error;
  }
};
