import { HonoEnv } from '@/middlewares/factory';
import { findById } from '@/repositories/headline-topic-programs.repository';
import { PostbackData } from '@/types';
import { messagingApi, webhook } from '@line/bot-sdk';
import { QiitaPost } from '@prisma/client';
import { formatDate } from '@tech-post-cast/commons';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { Context } from 'hono';

/**
 * ポストバックイベントを処理する
 * @param context Context
 * @param event PostbackEvent
 */
export const handlePostbackEvent = async (
  context: Context<HonoEnv>,
  event: webhook.PostbackEvent,
): Promise<void> => {
  console.debug(`event-handler.postback-event.handlePostbackEvent called`, {
    event,
  });
  const postbackData = new PostbackData(event.postback.data);
  if (postbackData.type !== 'headlineTopicProgram') {
    console.warn(`未対応のポストバックデータです`, {
      event,
    });
    return;
  }
  let replyMessages: messagingApi.Message[]; // 返信するメッセージ
  // ヘッドライントピック番組情報を取得する
  const prisma = context.var.prismaClient;
  const programId = postbackData.id;
  const program = await findById(prisma, programId);
  if (!program) {
    console.warn(`ヘッドライントピック番組が見つかりませんでした`, {
      programId,
    });
    replyMessages = [
      {
        type: 'text',
        text: '対象記事が見つかりませんでした',
      },
    ];
    return;
  }
  // 紹介記事のメッセージを生成する
  replyMessages = createIntroducedPostsMessage(program);
  const client = context.var.lineClient;
  // メッセージを返信する
  const res = await client.replyMessage({
    replyToken: event.replyToken!,
    messages: replyMessages,
  });
  console.log(`メッセージを返信しました`, {
    res,
  });
};

/**
 * 紹介記事のメッセージを生成する
 * @param program ヘッドライントピック番組
 * @returns FlexMessage
 */
const createIntroducedPostsMessage = (
  program: HeadlineTopicProgramWithQiitaPosts,
): (messagingApi.TextMessage | messagingApi.FlexMessage)[] => {
  console.debug(
    `event-handler.postback-event.createIntroducedPostsMessage called`,
    {
      program,
    },
  );
  // 紹介記事をいいね数が多い順に並び替える
  const sortedPosts = program.posts.sort((a, b) => b.likesCount - a.likesCount);
  const bubbles: messagingApi.FlexBubble[] = sortedPosts.map(
    (post: QiitaPost) => {
      return {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: post.title,
              color: '#ffffff',
              align: 'start',
              size: 'lg',
              gravity: 'center',
              wrap: true,
            },
            {
              type: 'text',
              text: post.authorName,
              color: '#ffffff',
              align: 'end',
              size: 'xs',
              gravity: 'center',
              margin: 'md',
            },
            {
              type: 'text',
              text: formatDate(post.createdAt, 'YYYY/MM/DD'),
              color: '#ffffff',
              align: 'end',
              size: 'xs',
              gravity: 'center',
              margin: 'md',
            },
          ],
          backgroundColor: '#55c500', // Qiita カラー
          paddingTop: '19px',
          paddingAll: '12px',
          paddingBottom: '16px',
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
                label: '記事を見る',
                uri: post.url,
              },
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'clipboard',
                label: '記事の URL をコピー',
                clipboardText: post.url,
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
      };
    },
  );
  const altText = `ヘッドライントピック「${program.title}」での紹介記事です`;
  const text: messagingApi.TextMessage = {
    type: 'text',
    text: altText,
  };
  const flex: messagingApi.FlexMessage = {
    type: 'flex',
    altText,
    contents: {
      type: 'carousel',
      contents: [...bubbles],
    },
  };
  return [text, flex];
};
