import { AppConfigService } from '@/app-config/app-config.service';
import { PostbackData } from '@/types';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { messagingApi, webhook } from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { QiitaPost } from '@prisma/client';
import { formatDate } from '@tech-post-cast/commons';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';

/**
 * 最新の番組情報を取得するためのメッセージ
 */
const LATEST_PROGRAM_MESSAGE = '最新のヘッドライントピック';

@Injectable()
export class LineBotService {
  private readonly logger = new Logger(LineBotService.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly headlineTopicProgramsRepository: HeadlineTopicProgramsRepository,
  ) {}

  /**
   * Messaging API にアクセスするためのクライアントを生成する
   */
  createLineBotClient(): messagingApi.MessagingApiClient {
    this.logger.debug(`LineBotService.createLineBotClient() called`);
    return new messagingApi.MessagingApiClient({
      channelAccessToken: this.appConfig.LineBotChannelAccessToken,
    });
  }

  /**
   * LINE Webhook イベントを処理する
   * @param event WebhookEvent
   */
  async handleWebhookEvent(event: webhook.Event): Promise<void> {
    this.logger.debug(`LineBotService.handleWebhook() called`, {
      event,
    });
    try {
      // Event 処理
      switch (event.type) {
        // メッセージイベントの場合
        case 'message':
          await this.handleMessageEvent(event);
          break;
        // ポストバックイベントの場合
        case 'postback':
          await this.handlePostbackEvent(event);
          break;
        default:
          this.logger.warn(`未対応のイベントタイプです`, {
            event,
          });
          break;
      }
      return;
    } catch (error) {
      this.logger.error(`LINE Webhook イベント処理中にエラーが発生しました`, {
        error,
      });
      // TODO エラーハンドリング
      throw error;
    }
  }

  /**
   * メッセージイベントを処理する
   * @param event MessageEvent
   */
  async handleMessageEvent(event: webhook.MessageEvent): Promise<void> {
    this.logger.debug(`LineBotService.handleMessageEvent() called`, {
      event,
    });
    // テキストメッセージの場合
    if (event.message.type === 'text') {
      const message: webhook.TextMessageContent = event.message;
      await this.handleTextMessageEvent(event, message);
    } else {
      // テキストメッセージ以外は未対応
      this.logger.warn(`未対応のメッセージタイプです`, {
        event,
      });
    }
  }

  /**
   * TextMessage の受信時処理
   * @param event MessageEvent
   * @param message TextEventMessage
   */
  async handleTextMessageEvent(
    event: webhook.MessageEvent,
    message: webhook.TextMessageContent,
  ): Promise<void> {
    this.logger.debug(`LineBotService.handleTextMessageEvent() called`, {
      event,
    });
    const replyToken = event.replyToken;
    const messageString = message.text;
    const client = this.createLineBotClient();
    let replyMessages: messagingApi.Message[]; // 返信するメッセージ
    if (message && LATEST_PROGRAM_MESSAGE === messageString.toLowerCase()) {
      // 最新の番組情報を取得する
      replyMessages = await this.createLatestProgramMessage();
    } else {
      // 番組情報の要求以外はオウム返し
      replyMessages = this.createEchoMessage(messageString);
    }
    // メッセージを返信する
    const res = await client.replyMessage({
      replyToken,
      messages: replyMessages,
    });
    this.logger.log(`メッセージを返信しました`, {
      res,
    });
  }

  /**
   * ポストバックイベントを処理する
   * @param event PostbackEvent
   */
  async handlePostbackEvent(event: webhook.PostbackEvent): Promise<void> {
    this.logger.debug(`LineBotService.handlePostbackEvent() called`, {
      event,
    });
    const postbackData = new PostbackData(event.postback.data);
    if (postbackData.type !== 'headlineTopicProgram') {
      this.logger.warn(`未対応のポストバックデータです`, {
        event,
      });
      return;
    }
    let replyMessages: messagingApi.Message[]; // 返信するメッセージ
    // ヘッドライントピック番組情報を取得する
    const programId = postbackData.id;
    const program =
      await this.headlineTopicProgramsRepository.findById(programId);
    if (!program) {
      this.logger.warn(`ヘッドライントピック番組が見つかりませんでした`, {
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
    replyMessages = this.createIntroducedPostsMessage(program);
    const client = this.createLineBotClient();
    // メッセージを返信する
    const res = await client.replyMessage({
      replyToken: event.replyToken,
      messages: replyMessages,
    });
    this.logger.log(`メッセージを返信しました`, {
      res,
    });
  }

  /**
   * 最新番組のメッセージを生成する
   * @returns メッセージ
   */
  async createLatestProgramMessage(): Promise<
    (
      | messagingApi.AudioMessage
      | messagingApi.TextMessage
      | messagingApi.FlexMessage
    )[]
  > {
    this.logger.debug(`LineBotService.createLatestProgramMessage() called`);
    const latestProgram =
      await this.headlineTopicProgramsRepository.findLatest();
    if (
      !latestProgram ||
      !latestProgram.videoUrl ||
      !latestProgram.videoUrl.startsWith('http')
    ) {
      return [
        {
          type: 'text',
          text: '最新の番組情報が見つかりませんでした',
        },
      ];
    }
    const programFileUrlPrefix = this.appConfig.ProgramFileUrlPrefix;
    const previewUrl = `${programFileUrlPrefix}/headline-topic-program/technology.jpg`;
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
          type: 'video',
          url: latestProgram.videoUrl,
          previewUrl: previewUrl,
          altContent: {
            type: 'image',
            size: 'full',
            aspectRatio: '1600:1066',
            aspectMode: 'cover',
            url: previewUrl,
          },
          action: {
            type: 'uri',
            label: '詳細はこちら',
            uri: programUrl,
          },
          aspectRatio: '1600:1066',
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
  }

  /**
   * 紹介記事のメッセージを生成する
   * @param program ヘッドライントピック番組
   * @returns FlexMessage
   */
  createIntroducedPostsMessage(
    program: HeadlineTopicProgramWithQiitaPosts,
  ): (messagingApi.TextMessage | messagingApi.FlexMessage)[] {
    this.logger.debug(`LineBotService.createIntroducedPostsMessage() called`, {
      program,
    });

    const bubbles: messagingApi.FlexBubble[] = program.posts.map(
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
  }

  /**
   * オウム返しのテキストメッセージを生成する
   * @param text テキスト
   * @returns テキストメッセージ
   */
  createEchoMessage(text: string): messagingApi.TextMessage[] {
    this.logger.debug(`LineBotService.createEchoMessage() called`, {
      text,
    });
    return [
      {
        type: 'text',
        text,
      },
    ];
  }
}
