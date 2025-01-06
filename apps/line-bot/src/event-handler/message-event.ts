import { messagingApi, webhook } from '@line/bot-sdk';

/**
 * メッセージイベントを処理する
 * @param event MessageEvent
 * @param client MessagingApiClient
 */
export const handleMessageEvent = async (
  event: webhook.MessageEvent,
  client: messagingApi.MessagingApiClient,
): Promise<void> => {
  console.debug(`handleMessageEvent() called`, {
    event,
  });
  // テキストメッセージの場合
  if (event.message.type === 'text') {
    const message: webhook.TextMessageContent = event.message;
    await handleTextMessageEvent(event, message, client);
  } else {
    // テキストメッセージ以外は未対応
    console.warn(`未対応のメッセージタイプです`, {
      event,
    });
  }
};

/**
 * 最新の番組情報を取得するためのメッセージ
 */
const LATEST_PROGRAM_MESSAGE = '最新のヘッドライントピック';

/**
 * TextMessage の受信時処理
 * @param event MessageEvent
 * @param message TextEventMessage
 * @param client MessagingApiClient
 */
const handleTextMessageEvent = async (
  event: webhook.MessageEvent,
  message: webhook.TextMessageContent,
  client: messagingApi.MessagingApiClient,
): Promise<void> => {
  console.debug(`handleTextMessageEvent() called`, {
    event,
    message,
  });
  const replyToken = event.replyToken!;
  const messageString = message.text;
  let replyMessages: messagingApi.Message[]; // 返信するメッセージ
  if (message && LATEST_PROGRAM_MESSAGE === messageString.toLowerCase()) {
    // 最新の番組情報を取得する
    // replyMessages = await this.createLatestProgramMessage();
    replyMessages = createEchoMessage(messageString);
  } else {
    // 番組情報の要求以外はオウム返し
    replyMessages = createEchoMessage(messageString);
  }
  // メッセージを返信する
  const res = await client.replyMessage({
    replyToken,
    messages: replyMessages,
  });
  console.log(`メッセージを返信しました`, {
    res,
  });
};

/**
 * オウム返しのテキストメッセージを生成する
 * @param text テキスト
 * @returns テキストメッセージ
 */
const createEchoMessage = (text: string): messagingApi.TextMessage[] => {
  console.debug(`LineBotService.createEchoMessage() called`, {
    text,
  });
  return [
    {
      type: 'text',
      text,
    },
  ];
};
