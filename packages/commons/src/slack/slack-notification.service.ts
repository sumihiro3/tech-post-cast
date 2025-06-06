/**
 * Slack通知サービス
 * Slack Webhook URLを使用した通知送信の共通処理を提供
 */

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
  static buildPersonalProgramNotificationMessage(userData: {
    displayName: string;
    attempts: Array<{
      feedName: string;
      status: string;
      reason: string | null;
      postCount: number;
      program?: {
        title: string;
        audioUrl: string;
      } | null;
    }>;
  }): SlackMessage {
    const successCount = userData.attempts.filter((a) => a.status === 'SUCCESS').length;
    const skippedCount = userData.attempts.filter((a) => a.status === 'SKIPPED').length;
    const failedCount = userData.attempts.filter((a) => a.status === 'FAILED').length;

    // ヘッダーブロック
    const headerBlock: SlackBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🎙️ *${userData.displayName}さんのパーソナルプログラム生成結果*`,
      },
    };

    // サマリーブロック
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

    // 各フィードの詳細
    for (const attempt of userData.attempts) {
      const statusEmoji = this.getStatusEmoji(attempt.status);
      const statusText = this.getStatusText(attempt.status);

      let detailText = `${statusEmoji} *${attempt.feedName}* - ${statusText}`;

      if (attempt.status === 'SUCCESS' && attempt.program) {
        detailText += `\n📝 タイトル: ${attempt.program.title}`;
        detailText += `\n🎵 <${attempt.program.audioUrl}|音声を聞く>`;
        detailText += `\n📰 記事数: ${attempt.postCount}件`;
      } else if (attempt.status === 'SKIPPED' || attempt.status === 'FAILED') {
        detailText += `\n💬 理由: ${attempt.reason || '不明'}`;
        if (attempt.postCount > 0) {
          detailText += `\n📰 記事数: ${attempt.postCount}件`;
        }
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: detailText,
        },
      });
    }

    // フッター
    blocks.push({
      type: 'divider',
    });

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} | TechPostCast`,
        },
      ],
    });

    return {
      username: 'TechPostCast 通知',
      icon_emoji: ':microphone:',
      blocks,
    };
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
        return '生成成功';
      case 'SKIPPED':
        return 'スキップ';
      case 'FAILED':
        return '生成失敗';
      default:
        return '不明';
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
