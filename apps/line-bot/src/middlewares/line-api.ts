import { messagingApi } from '@line/bot-sdk';

/**
 * Messaging API にアクセスするためのクライアントを生成する
 * @param channelAccessToken LINE Bot のチャンネルアクセストークン
 * @returns MessagingApiClient
 */
export const createLineBotClient = (
  channelAccessToken: string,
): messagingApi.MessagingApiClient => {
  console.debug(`LineBotService.createLineBotClient() called`);
  return new messagingApi.MessagingApiClient({
    channelAccessToken,
  });
};
