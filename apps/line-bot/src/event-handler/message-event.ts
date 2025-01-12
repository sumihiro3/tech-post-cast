import { HonoEnv } from '@/middlewares/factory';
import { findLatest } from '@/repositories/headline-topic-programs.repository';
import { messagingApi, webhook } from '@line/bot-sdk';
import { formatDate } from '@tech-post-cast/commons';
import { Context } from 'hono';

/**
 * メッセージイベントを処理する
 * @param context Context
 * @param event MessageEvent
 */
export const handleMessageEvent = async (
  context: Context<HonoEnv>,
  event: webhook.MessageEvent,
): Promise<void> => {
  console.debug(`event-handler.message-event.handleMessageEvent called`, {
    event,
  });
  // テキストメッセージの場合
  if (event.message.type === 'text') {
    const message: webhook.TextMessageContent = event.message;
    await handleTextMessageEvent(context, event, message);
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
 * @param context Context
 * @param event MessageEvent
 * @param message TextEventMessage
 */
const handleTextMessageEvent = async (
  context: Context<HonoEnv>,
  event: webhook.MessageEvent,
  message: webhook.TextMessageContent,
): Promise<void> => {
  console.debug(`event-handler.message-event.handleTextMessageEvent called`, {
    event,
    message,
  });
  const replyToken = event.replyToken!;
  const messageString = message.text;
  let replyMessages: messagingApi.Message[]; // 返信するメッセージ
  if (message && LATEST_PROGRAM_MESSAGE === messageString.toLowerCase()) {
    // 最新の番組情報を取得する
    replyMessages = await createLatestProgramMessage(context);
  } else {
    // 番組情報の要求以外はオウム返し
    replyMessages = createEchoMessage(messageString);
  }
  // メッセージを返信する
  const client = context.var.lineClient;
  const res = await client.replyMessage({
    replyToken,
    messages: replyMessages,
  });
  console.log(`テキストメッセージの処理が完了し、メッセージを返信しました`, {
    replyMessages,
    res,
  });
};

/**
 * オウム返しのテキストメッセージを生成する
 * @param text テキスト
 * @returns テキストメッセージ
 */
const createEchoMessage = (text: string): messagingApi.TextMessage[] => {
  console.debug(`event-handler.message-event.createEchoMessage called`, {
    text,
  });
  return [
    {
      type: 'text',
      text,
    },
  ];
};

/**
 * 最新番組のメッセージを生成する
 * @returns メッセージ
 */
const createLatestProgramMessage = async (
  context: Context<HonoEnv>,
): Promise<
  (
    | messagingApi.AudioMessage
    | messagingApi.TextMessage
    | messagingApi.FlexMessage
  )[]
> => {
  console.debug(
    `event-handler.message-event.createLatestProgramMessage called`,
  );
  const prismaClient = context.var.prismaClient;
  const latestProgram = await findLatest(prismaClient);
  if (!latestProgram) {
    return [
      {
        type: 'text',
        text: '最新の番組情報が見つかりませんでした',
      },
    ];
  }
  const programFileUrlPrefix = context.env.PROGRAM_FILE_URL_PREFIX;
  const imageUrl = `${programFileUrlPrefix}/TechPostCast_Main_gradation.png`;
  const programUrl = latestProgram.audioUrl;
  const flex: messagingApi.FlexMessage = {
    type: 'flex',
    altText: `ヘッドライントピック：${latestProgram.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: latestProgram.title,
            weight: 'bold',
            size: 'xl',
            wrap: true,
          },
          {
            type: 'text',
            text: formatDate(latestProgram.createdAt, 'YYYY/MM/DD'),
            align: 'end',
            size: 'xs',
          },
        ],
      },
      hero: {
        type: 'image',
        url: imageUrl,
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover',
        action: {
          type: 'uri',
          uri: programUrl,
        },
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'uri',
              label: '番組を再生する',
              uri: programUrl,
            },
          },
          {
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
              type: 'postback',
              label: '紹介記事',
              data: `type=headlineTopicProgram&id=${latestProgram.id}`,
              displayText: '紹介記事',
              inputOption: 'closeRichMenu',
            },
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [],
            margin: 'sm',
          },
        ],
        flex: 0,
      },
    },
  };
  return [flex];
};
