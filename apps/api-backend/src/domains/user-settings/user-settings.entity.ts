/**
 * ユーザー設定エンティティ
 * パーソナルプログラム用のユーザー名やSlack通知設定を管理する
 */
export interface UserSettings {
  /** ユーザーID */
  userId: string;
  /** パーソナルプログラム内で使用される表示名（AppUser.displayNameを使用） */
  displayName: string;
  /** 個別のSlack Webhook URL（番組生成完了時の通知用） */
  slackWebhookUrl?: string;
  /** 通知が有効かどうかを表すフラグ */
  notificationEnabled: boolean;
  /** 設定の最終更新日時 */
  updatedAt: Date;
}

/**
 * ユーザー設定更新パラメータ
 */
export interface UpdateUserSettingsParams {
  /** パーソナルプログラム内で使用される表示名 */
  displayName?: string;
  /** 個別のSlack Webhook URL */
  slackWebhookUrl?: string;
  /** 通知が有効かどうかを表すフラグ */
  notificationEnabled?: boolean;
}

/**
 * Slack Webhook URLテスト結果
 */
export interface SlackWebhookTestResult {
  /** テストが成功したかどうか */
  success: boolean;
  /** エラーメッセージ（失敗時） */
  errorMessage?: string;
  /** レスポンス時間（ミリ秒） */
  responseTime: number;
}
