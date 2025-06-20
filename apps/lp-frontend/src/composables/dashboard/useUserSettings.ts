/**
 * ユーザー設定のCRUD操作を行うcomposable
 *
 * @description
 * ユーザー設定の取得、更新、リセット機能を提供します。
 * API呼び出し、状態管理、エラーハンドリングを統合的に管理します。
 */

import type {
  RegenerateRssTokenResponseDto,
  TestSlackWebhookRequestDto,
  TestSlackWebhookResponseDto,
  UpdateUserSettingsRequestDto,
} from '@/api';
import { ref, type Ref } from 'vue';

/**
 * ユーザー設定データの型定義
 */
export interface UserSettings {
  /** 表示名 - パーソナル番組内で使用される表示名 */
  displayName: string;
  /** Slack Webhook URL - 番組生成完了時の通知用URL */
  slackWebhookUrl: string;
  /** 通知有効フラグ - Slack通知が有効かどうかを示すフラグ */
  notificationEnabled: boolean;
  /** RSS機能有効フラグ - RSS機能が有効かどうかを示すフラグ */
  rssEnabled: boolean;
  /** RSSトークン - RSS配信用のトークン（RSS機能が有効な場合のみ） */
  rssToken?: string;
  /** RSS URL - RSS配信URL（RSS機能が有効な場合のみ） */
  rssUrl?: string;
  /** 複数話者モード有効フラグ - 複数話者モードでのパーソナルプログラムを作成できるかどうかを示すフラグ */
  personalizedProgramDialogueEnabled: boolean;
}

/**
 * useUserSettings composable の戻り値の型定義
 */
export interface UseUserSettingsReturn {
  /** 現在の設定値 - リアクティブな設定データ */
  settings: Ref<UserSettings>;
  /** 元の設定値 - 変更検知用の初期値 */
  originalSettings: Ref<UserSettings>;
  /** ローディング状態 - API通信中かどうかを示すフラグ */
  loading: Ref<boolean>;
  /** エラーメッセージ - API通信エラーやバリデーションエラーのメッセージ */
  error: Ref<string | null>;
  /** 変更検知フラグ - 設定に変更があるかどうかを示す計算プロパティ */
  hasChanges: Ref<boolean>;
  /** 設定取得関数 - サーバーから現在の設定を取得する */
  fetchSettings: () => Promise<void>;
  /** 設定更新関数 - サーバーに設定を保存する */
  updateSettings: (data: Partial<UserSettings>) => Promise<boolean>;
  /** 設定リセット関数 - 変更を破棄して元の状態に戻す */
  resetSettings: () => void;
  /** 表示名バリデーション関数 - 表示名の妥当性をチェックする */
  validateDisplayName: (displayName: string) => string | null;
  /** Webhook URLバリデーション関数 - Webhook URLの妥当性をチェックする */
  validateSlackWebhookUrl: (url: string) => string | null;
  /** Webhook URLテスト関数 - 指定されたWebhook URLにテスト送信を行う */
  testSlackWebhook: (webhookUrl: string) => Promise<TestSlackWebhookResponseDto>;
  /** RSSトークン再生成関数 - 新しいRSSトークンを生成し、新しいRSS URLを発行する */
  regenerateRssToken: () => Promise<RegenerateRssTokenResponseDto>;
}

/**
 * ユーザー設定管理のcomposable
 *
 * @returns {UseUserSettingsReturn} ユーザー設定管理に必要な状態と関数
 */
export const useUserSettings = (): UseUserSettingsReturn => {
  const { $userSettingsApi } = useNuxtApp();

  // 状態管理
  const settings = ref<UserSettings>({
    displayName: '',
    slackWebhookUrl: '',
    notificationEnabled: false,
    rssEnabled: false,
    rssToken: undefined,
    rssUrl: undefined,
    personalizedProgramDialogueEnabled: false,
  });

  const originalSettings = ref<UserSettings>({
    displayName: '',
    slackWebhookUrl: '',
    notificationEnabled: false,
    rssEnabled: false,
    rssToken: undefined,
    rssUrl: undefined,
    personalizedProgramDialogueEnabled: false,
  });

  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * 設定に変更があるかどうかを判定
   */
  const hasChanges = computed(() => {
    return (
      settings.value.displayName !== originalSettings.value.displayName ||
      settings.value.slackWebhookUrl !== originalSettings.value.slackWebhookUrl ||
      settings.value.notificationEnabled !== originalSettings.value.notificationEnabled ||
      settings.value.rssEnabled !== originalSettings.value.rssEnabled
    );
  });

  /**
   * ユーザー設定を取得
   *
   * @throws {Error} API呼び出しに失敗した場合
   */
  const fetchSettings = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $userSettingsApi.getUserSettings();

      const fetchedSettings: UserSettings = {
        displayName: response.data.displayName,
        slackWebhookUrl: response.data.slackWebhookUrl || '',
        notificationEnabled: response.data.notificationEnabled,
        rssEnabled: response.data.rssEnabled,
        rssToken: response.data.rssToken,
        rssUrl: response.data.rssUrl,
        personalizedProgramDialogueEnabled: response.data.personalizedProgramDialogueEnabled,
      };

      settings.value = { ...fetchedSettings };
      originalSettings.value = { ...fetchedSettings };
    } catch (err: unknown) {
      console.error('ユーザー設定の取得に失敗しました:', err);
      const errorMessage = 'ユーザー設定の取得に失敗しました';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * ユーザー設定を更新
   *
   * @param {Partial<UserSettings>} data - 更新するデータ
   * @returns {Promise<boolean>} 更新が成功した場合はtrue
   * @throws {Error} API呼び出しに失敗した場合
   */
  const updateSettings = async (data: Partial<UserSettings>): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      // バリデーション
      if (data.displayName !== undefined) {
        const displayNameError = validateDisplayName(data.displayName);
        if (displayNameError) {
          error.value = displayNameError;
          return false;
        }
      }

      if (data.slackWebhookUrl !== undefined) {
        const webhookError = validateSlackWebhookUrl(data.slackWebhookUrl);
        if (webhookError) {
          error.value = webhookError;
          return false;
        }
      }

      const requestData: UpdateUserSettingsRequestDto = {};
      if (data.displayName !== undefined) {
        requestData.displayName = data.displayName;
      }
      if (data.slackWebhookUrl !== undefined) {
        // 通知が無効の場合は空文字を送信（削除）
        // 通知が有効の場合はWebhook URLを送信
        requestData.slackWebhookUrl = data.slackWebhookUrl;
      }
      if (data.notificationEnabled !== undefined) {
        requestData.notificationEnabled = data.notificationEnabled;
      }
      if (data.rssEnabled !== undefined) {
        requestData.rssEnabled = data.rssEnabled;
      }

      const response = await $userSettingsApi.updateUserSettings(requestData);

      const updatedSettings: UserSettings = {
        displayName: response.data.displayName,
        slackWebhookUrl: response.data.slackWebhookUrl || '',
        notificationEnabled: response.data.notificationEnabled,
        rssEnabled: response.data.rssEnabled,
        rssToken: response.data.rssToken,
        rssUrl: response.data.rssUrl,
        personalizedProgramDialogueEnabled: response.data.personalizedProgramDialogueEnabled,
      };

      settings.value = { ...updatedSettings };
      originalSettings.value = { ...updatedSettings };

      return true;
    } catch (err: unknown) {
      console.error('ユーザー設定の更新に失敗しました:', err);

      // より詳細なエラーメッセージを生成
      let errorMessage = 'ユーザー設定の更新に失敗しました';

      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string }; status?: number } })
          .response;
        if (response?.data?.message) {
          errorMessage = `更新エラー: ${response.data.message}`;
        } else if (response?.status) {
          errorMessage = `更新エラー: HTTPステータス ${response.status}`;
        }
      } else if (err instanceof Error) {
        errorMessage = `更新エラー: ${err.message}`;
      }

      error.value = errorMessage;
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 設定を元の状態にリセット
   */
  const resetSettings = (): void => {
    settings.value = { ...originalSettings.value };
    error.value = null;
  };

  /**
   * 表示名のバリデーション
   *
   * @param {string} displayName - 検証する表示名
   * @returns {string | null} エラーメッセージ、または null（正常な場合）
   */
  const validateDisplayName = (displayName: string): string | null => {
    if (!displayName || displayName.trim() === '') {
      return '表示名を入力してください';
    }

    if (displayName.length > 50) {
      return '表示名は50文字以内で入力してください';
    }

    return null;
  };

  /**
   * Slack Webhook URL のバリデーション
   *
   * @param {string} url - 検証するURL
   * @returns {string | null} エラーメッセージ、または null（正常な場合）
   */
  const validateSlackWebhookUrl = (url: string): string | null => {
    // 空文字は許可（通知無効時）
    if (!url || url.trim() === '') {
      return null;
    }

    // URL形式の基本チェック
    try {
      const urlObj = new URL(url);

      // Slack Webhook URLの形式チェック
      if (!urlObj.hostname.includes('hooks.slack.com')) {
        return '正しいSlack Webhook URLを入力してください';
      }

      if (!urlObj.pathname.startsWith('/services/')) {
        return '正しいSlack Webhook URLを入力してください';
      }

      return null;
    } catch {
      return '正しいSlack Webhook URLを入力してください';
    }
  };

  /**
   * Slack Webhook URLのテスト
   *
   * @param {string} webhookUrl - テストするWebhook URL
   * @returns {Promise<TestSlackWebhookResponseDto>} テスト結果
   */
  const testSlackWebhook = async (webhookUrl: string): Promise<TestSlackWebhookResponseDto> => {
    const requestData: TestSlackWebhookRequestDto = {
      webhookUrl,
    };

    const response = await $userSettingsApi.testSlackWebhook(requestData);
    return response.data;
  };

  /**
   * RSSトークンの再生成
   *
   * @returns {Promise<RegenerateRssTokenResponseDto>} 再生成結果
   * @throws {Error} API呼び出しに失敗した場合
   */
  const regenerateRssToken = async (): Promise<RegenerateRssTokenResponseDto> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $userSettingsApi.regenerateRssToken();

      // 設定を更新（新しいトークンとURLを反映）
      settings.value.rssToken = response.data.rssToken;
      settings.value.rssUrl = response.data.rssUrl;
      originalSettings.value.rssToken = response.data.rssToken;
      originalSettings.value.rssUrl = response.data.rssUrl;

      return response.data;
    } catch (err: unknown) {
      console.error('RSSトークンの再生成に失敗しました:', err);

      // より詳細なエラーメッセージを生成
      let errorMessage = 'RSSトークンの再生成に失敗しました';

      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string }; status?: number } })
          .response;
        if (response?.data?.message) {
          errorMessage = `再生成エラー: ${response.data.message}`;
        } else if (response?.status) {
          errorMessage = `再生成エラー: HTTPステータス ${response.status}`;
        }
      } else if (err instanceof Error) {
        errorMessage = `再生成エラー: ${err.message}`;
      }

      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    settings,
    originalSettings,
    loading,
    error,
    hasChanges,
    fetchSettings,
    updateSettings,
    resetSettings,
    validateDisplayName,
    validateSlackWebhookUrl,
    testSlackWebhook,
    regenerateRssToken,
  };
};
