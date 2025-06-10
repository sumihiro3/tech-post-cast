import { PersonalizedProgramAttemptWithNotificationData } from '@tech-post-cast/database';

/**
 * PersonalizedProgramAttempt用のリポジトリインターフェース
 */

/**
 * ユーザーごとの通知対象データ
 */
export interface UserNotificationData {
  userId: string;
  user: {
    displayName: string;
    slackWebhookUrl: string | null;
    notificationEnabled: boolean;
  };
  attempts: PersonalizedProgramAttemptWithNotificationData[];
}

/**
 * 通知ステータス更新用のデータ
 */
export interface NotificationStatusUpdate {
  attemptIds: string[];
  success: boolean;
  error?: string;
}

/**
 * PersonalizedProgramAttemptリポジトリインターフェース
 */
export interface IPersonalizedProgramAttemptsRepository {
  /**
   * 指定日の未通知レコードを取得し、ユーザーごとに集約する
   * @param targetDate 対象日
   * @returns ユーザーごとの通知対象データ
   */
  findUnnotifiedDataByUser(targetDate: Date): Promise<UserNotificationData[]>;

  /**
   * 通知ステータスを更新する
   * @param updates 更新データ
   */
  updateNotificationStatus(updates: NotificationStatusUpdate[]): Promise<void>;

  /**
   * 複数のattemptの通知ステータスを一括更新する
   * @param attemptIds 更新対象のattempt ID配列
   * @param success 通知送信成功フラグ
   * @param error エラーメッセージ（失敗時のみ）
   */
  updateNotificationStatusBatch(
    attemptIds: string[],
    success: boolean,
    error?: string,
  ): Promise<void>;
}
