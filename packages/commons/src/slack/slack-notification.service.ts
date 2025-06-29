/**
 * Slack通知サービス
 * Slack Webhook URLを使用した通知送信の共通処理を提供
 */

import { formatDate, TIME_ZONE_JST } from '../date.util';

export interface SlackBlock {
  type: string;
  [key: string]: any;
}

export interface SlackMessage {
  username?: string;
  icon_emoji?: string;
  text?: string;
  blocks?: SlackBlock[];
}

export interface SlackNotificationResult {
  success: boolean;
  error?: string;
  responseTime: number;
}

/**
 * Slack通知サービス
 */
export class SlackNotificationService {
  /**
   * Slack Webhook URLに通知を送信する
   * @param webhookUrl Slack Webhook URL
   * @param message 送信するメッセージ
   * @returns 送信結果
   */
  static async sendNotification(
    webhookUrl: string,
    message: SlackMessage,
  ): Promise<SlackNotificationResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorMessage = `Slack API エラー: ${response.status} ${response.statusText}`;
        return {
          success: false,
          error: errorMessage,
          responseTime,
        };
      }

      return {
        success: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      };
    }
  }

  /**
   * パーソナルプログラム生成結果の通知メッセージを構築する
   * @param userData ユーザーデータ
   * @returns Slackメッセージ
   */
  static buildPersonalProgramNotificationMessage(
    userData: {
      displayName: string;
      attempts: Array<{
        feedName: string;
        status: string;
        reason: string | null;
        postCount: number;
        program?: {
          id: string;
          title: string;
          audioUrl: string;
        } | null;
      }>;
    },
    lpBaseUrl: string,
    audioFileBaseUrl: string,
  ): SlackMessage {
    const successCount = userData.attempts.filter((a) => a.status === 'SUCCESS').length;
    const skippedCount = userData.attempts.filter((a) => a.status === 'SKIPPED').length;
    const failedCount = userData.attempts.filter((a) => a.status === 'FAILED').length;

    // 時間帯に応じた挨拶を取得
    const greeting = this.getTimeBasedGreeting();

    // ヘッダーブロック（より魅力的なメッセージ）
    const headerBlock: SlackBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${greeting} *${userData.displayName}さん* ！\n🎧 パーソナルプログラムの配信結果をお知らせします`,
      },
    };

    // サマリーブロック（視覚的に改善）
    const summaryBlock: SlackBlock = {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `✅ *成功:* ${successCount}件`,
        },
        {
          type: 'mrkdwn',
          text: `⏭️ *スキップ:* ${skippedCount}件`,
        },
        {
          type: 'mrkdwn',
          text: `❌ *失敗:* ${failedCount}件`,
        },
        {
          type: 'mrkdwn',
          text: `📊 *合計:* ${userData.attempts.length}件`,
        },
      ],
    };

    const blocks: SlackBlock[] = [headerBlock, summaryBlock];

    // 区切り線
    if (userData.attempts.length > 0) {
      blocks.push({
        type: 'divider',
      });
    }

    // 各フィードの詳細
    for (const attempt of userData.attempts) {
      const statusEmoji = this.getStatusEmoji(attempt.status);
      const statusText = this.getStatusText(attempt.status);

      if (attempt.status === 'SUCCESS' && attempt.program) {
        // 成功時：リッチなプログラム表示
        const programUrl = `${lpBaseUrl}/app/programs/${attempt.program.id}`;

        const programBlock: SlackBlock = {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmoji} パーソナルフィード *「${attempt.feedName}」* で新しい番組が配信されました！\n\n*${attempt.program.title}*\n\n<${programUrl}|📄 番組詳細> | 📰 紹介記事数: ${attempt.postCount}件`,
          },
          accessory: {
            type: 'image',
            image_url: `${audioFileBaseUrl}/TechPostCast_Main_gradation.png`,
            alt_text: 'Tech Post Cast',
          },
        };
        blocks.push(programBlock);
      } else {
        // スキップ・失敗時：シンプルな表示
        let detailText = `${statusEmoji} *${attempt.feedName}* - ${statusText}`;

        if (attempt.reason) {
          detailText += `\n💬 理由: ${this.getReasonText(attempt.reason)}`;
        }

        if (attempt.postCount > 0) {
          detailText += `\n📰 記事数: ${attempt.postCount}件`;
        }

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: detailText,
          },
        });
      }

      // フィード間の区切り（最後のフィード以外）
      if (attempt !== userData.attempts[userData.attempts.length - 1]) {
        blocks.push({
          type: 'divider',
        });
      }
    }

    // フッター情報
    blocks.push({
      type: 'divider',
    });

    // 詳細なフッター
    const dt = formatDate(new Date(), 'YYYY年M月D日 HH:mm', TIME_ZONE_JST);
    const footerBlock: SlackBlock = {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 ${dt} | <${lpBaseUrl}|TechPostCast>`,
        },
      ],
    };

    // 成功した番組がある場合は、サイトへの誘導を追加
    if (successCount > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🌟 *<${lpBaseUrl}|TechPostCast サイト>* で他の番組もチェックしてみてください！`,
        },
      });
    }

    blocks.push(footerBlock);

    return {
      username: 'TechPostCast 通知',
      icon_emoji: ':microphone:',
      blocks,
    };
  }

  /**
   * 時間帯に応じた挨拶を取得
   */
  private static getTimeBasedGreeting(): string {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 10) {
      return '🌅 おはようございます';
    } else if (hour >= 10 && hour < 17) {
      return '☀️ こんにちは';
    } else if (hour >= 17 && hour < 21) {
      return '🌆 こんばんは';
    } else {
      return '🌙 お疲れさまです';
    }
  }

  /**
   * ステータスに対応する絵文字を取得
   */
  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '✅';
      case 'SKIPPED':
        return '⏭️';
      case 'FAILED':
        return '❌';
      default:
        return '❓';
    }
  }

  /**
   * ステータスに対応するテキストを取得
   */
  private static getStatusText(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return '番組生成成功';
      case 'SKIPPED':
        return '番組生成スキップ';
      case 'FAILED':
        return '番組生成失敗';
      default:
        return '状態不明';
    }
  }

  /**
   * 失敗理由コードを日本語に変換
   */
  private static getReasonText(reason: string): string {
    switch (reason) {
      case 'NOT_ENOUGH_POSTS':
        return '紹介記事数が不足';
      case 'UPLOAD_ERROR':
        return 'アップロードエラー';
      case 'PERSISTENCE_ERROR':
        return 'データ保存エラー';
      case 'OTHER':
        return 'エラー';
      default:
        return reason; // 未知の理由コードの場合はそのまま表示
    }
  }

  /**
   * Webhook URLをマスクする（ログ出力用）
   * @param webhookUrl Webhook URL
   * @returns マスクされたURL
   */
  static maskWebhookUrl(webhookUrl: string): string {
    try {
      const url = new URL(webhookUrl);
      const pathParts = url.pathname.split('/');
      if (pathParts.length >= 5) {
        // /services/T.../B.../... の最後の部分をマスク
        pathParts[pathParts.length - 1] = '***';
        url.pathname = pathParts.join('/');
      }
      return url.toString();
    } catch {
      return '***';
    }
  }
}
