/**
 * Slack通知メッセージのブロック構造
 */
export interface SlackNotificationMessage {
  blocks: SlackBlock[];
}

/**
 * Slackブロック
 */
export interface SlackBlock {
  type: 'section' | 'divider';
  text?: SlackText;
  fields?: SlackText[];
  accessory?: SlackAccessory;
}

/**
 * Slackテキスト
 */
export interface SlackText {
  type: 'mrkdwn' | 'plain_text';
  text: string;
}

/**
 * Slackアクセサリー（画像など）
 */
export interface SlackAccessory {
  type: 'image';
  image_url: string;
  alt_text: string;
}

/**
 * フィード結果の通知データ
 */
export interface FeedNotificationData {
  feedName: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  postCount: number;
  reason?: string;
  programUrl?: string;
}

/**
 * ユーザー通知データ
 */
export interface UserNotificationData {
  userId: string;
  userName: string;
  slackWebhookUrl: string;
  feeds: FeedNotificationData[];
}
