import { AppConfigService } from '@/app-config/app-config.service';
import * as line from '@line/bot-sdk';
import {
  AudioMessage,
  FlexMessage,
  TextMessage,
  WebhookEvent,
} from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';

/**
 * 最新の番組情報を取得するためのメッセージ
 */
const LATEST_PROGRAM_MESSAGE = 'program';

@Injectable()
export class LineBotService {
  private readonly logger = new Logger(LineBotService.name);

  constructor(private readonly appConfig: AppConfigService) {}

  /**
   * Messaging API にアクセスするためのクライアントを生成する
   */
  createLineBotClient(): line.messagingApi.MessagingApiClient {
    this.logger.debug(`LineBotService.createLineBotClient() called`);
    return new line.messagingApi.MessagingApiClient({
      channelAccessToken: this.appConfig.LineBotChannelAccessToken,
    });
  }

  /**
   * LINE Webhook イベントを処理する
   * @param event WebhookEvent
   */
  async handleWebhookEvent(event: WebhookEvent): Promise<void> {
    this.logger.debug(`LineBotService.handleWebhook() called`, {
      event,
    });
    // Event 処理
    // テキストメッセージ以外は無視する
    if (event.type !== 'message' || event.message.type !== 'text') return;
    const replyToken = event.replyToken;
    const message = event.message.text;
    const client = this.createLineBotClient();
    let replyMessages; // 返信するメッセージ
    if (message && LATEST_PROGRAM_MESSAGE === message.toLowerCase()) {
      // 最新の番組情報を取得する
      replyMessages = this.createLatestProgramMessage();
    } else {
      // 番組情報の要求以外はオウム返し
      replyMessages = this.createEchoMessage(message);
    }
    // メッセージを返信する
    const res = await client.replyMessage({
      replyToken,
      messages: replyMessages,
    });
    this.logger.log(`メッセージを返信しました`, {
      res,
    });
    return;
  }

  /**
   * 番組の音声メッセージを生成する
   */
  createLatestProgramMessage(): (AudioMessage | TextMessage | FlexMessage)[] {
    this.logger.debug(`LineBotService.createLatestProgramMessage() called`);
    const flex: FlexMessage = {
      type: 'flex',
      altText: '最新のヘッドライントピックです',
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'Headline topic',
              weight: 'bold',
              size: 'xl',
            },
            {
              type: 'text',
              text: '2024/12/13',
              align: 'end',
              size: 'xs',
            },
          ],
        },
        hero: {
          type: 'video',
          url: 'https://d2ohwgmlpn9j5f.cloudfront.net/headline-topic-program/20241213/headline-topic-program_1734015600000.mp4',
          previewUrl:
            'https://d2ohwgmlpn9j5f.cloudfront.net/headline-topic-program/technology.jpg',
          altContent: {
            type: 'image',
            size: 'full',
            aspectRatio: '1600:1066',
            aspectMode: 'cover',
            url: 'https://d2ohwgmlpn9j5f.cloudfront.net/headline-topic-program/technology.jpg',
          },
          action: {
            type: 'uri',
            label: '詳細はこちら',
            uri: 'https://google.co.jp/',
          },
          aspectRatio: '1600:1066',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '※画像をタップすると再生できます',
              size: 'xxs',
              wrap: true,
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [],
              margin: 'lg',
            },
          ],
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
                label: '今日のトピックス',
                uri: 'https://google.co.jp/',
              },
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '過去の番組',
                uri: 'https://google.co.jp/',
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
   * オウム返しのテキストメッセージを生成する
   * @param text テキスト
   */
  createEchoMessage(text: string): TextMessage[] {
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
