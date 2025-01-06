import { messagingApi, webhook } from '@line/bot-sdk';
import { handleMessageEvent } from './message-event';

/**
 * LINE Webhook イベントを処理する
 * @param event WebhookEvent
 */
export const handleWebhookEvent = async (
  event: webhook.Event,
  client: messagingApi.MessagingApiClient,
): Promise<void> => {
  console.debug(`LineBotService.handleWebhook() called`, {
    event,
  });
  try {
    // Event 処理
    switch (event.type) {
      // メッセージイベントの場合
      case 'message':
        await handleMessageEvent(event, client);
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
