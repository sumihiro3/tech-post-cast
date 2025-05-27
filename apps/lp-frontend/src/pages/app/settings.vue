<template lang="pug">
div
  // ページヘッダー
  .mb-6
    h1.text-h4.font-weight-bold.mb-2 ユーザー設定
    p.text-body-1.text-medium-emphasis
      | アカウント情報と通知設定を管理できます

  // エラー表示
  v-alert.mb-6(
    v-if="error"
    type="error"
    variant="tonal"
    closable
    @click:close="clearError"
  )
    template(#prepend)
      v-icon mdi-alert-circle
    | {{ error }}

  // 成功メッセージ
  v-alert.mb-6(
    v-if="successMessage"
    type="success"
    variant="tonal"
    closable
    @click:close="clearSuccessMessage"
  )
    template(#prepend)
      v-icon mdi-check-circle
    | {{ successMessage }}

  // 設定セクション
  .settings-container
    // ユーザー名設定セクション
    DashboardSettingsUserNameSection(
      v-model="settings.displayName"
      :error="displayNameError"
      :disabled="loading"
      @blur="validateDisplayName"
    )

    // Slack通知設定セクション
    DashboardSettingsSlackWebhookSection(
      v-model:webhook-url="settings.slackWebhookUrl"
      v-model:notification-enabled="settings.notificationEnabled"
      :error="slackWebhookError"
      :disabled="loading"
      :on-test-webhook="handleTestWebhook"
      @blur="validateSlackWebhook"
    )

    // アクションボタン
    .d-flex.justify-end.gap-2.mt-8
      v-btn(
        v-if="hasChanges"
        :disabled="loading"
        variant="outlined"
        color="grey"
        prepend-icon="mdi-refresh"
        @click="handleReset"
      ) リセット

      v-btn(
        :loading="loading"
        :disabled="!hasChanges"
        color="primary"
        prepend-icon="mdi-content-save"
        @click="handleSave"
      ) 保存
</template>

<script setup lang="ts">
import type { TestSlackWebhookResponseDto } from '@/api';
import { useUserSettings } from '@/composables/dashboard/useUserSettings';

// SEO設定
definePageMeta({
  layout: 'user-app',
  title: 'ユーザー設定',
});

// Composables
const {
  settings,
  loading,
  error,
  hasChanges,
  fetchSettings,
  updateSettings,
  resetSettings,
  validateDisplayName: validateDisplayNameFn,
  validateSlackWebhookUrl: validateSlackWebhookUrlFn,
  testSlackWebhook,
} = useUserSettings();

// ローカル状態
/** 成功メッセージ - 設定保存成功時に表示されるメッセージ */
const successMessage = ref<string | null>(null);
/** 表示名エラー - 表示名のバリデーションエラーメッセージ */
const displayNameError = ref<string | null>(null);
/** Slack Webhook URLエラー - Webhook URLのバリデーションエラーメッセージ */
const slackWebhookError = ref<string | null>(null);

/**
 * ページ初期化
 */
onMounted(async () => {
  try {
    await fetchSettings();
  } catch (err) {
    console.error('設定の取得に失敗しました:', err);
  }
});

/**
 * 設定保存のハンドラ
 *
 * 実行タイミング: ユーザーが「保存」ボタンをクリックした際
 * 処理内容:
 * 1. 通知有効時のWebhook URL必須チェック
 * 2. 表示名とWebhook URLのバリデーション実行
 * 3. バリデーション通過後、APIを呼び出して設定を保存
 * 4. 成功時は成功メッセージを表示し、3秒後に自動消去
 */
const handleSave = async (): Promise<void> => {
  // 通知が有効な場合はWebhook URLが必須
  if (settings.value.notificationEnabled && !settings.value.slackWebhookUrl.trim()) {
    slackWebhookError.value = 'Slack通知を有効にする場合はWebhook URLの設定が必要です';
    return;
  }

  // バリデーション実行
  const displayNameValidation = validateDisplayNameFn(settings.value.displayName);
  let slackWebhookValidation: string | null = null;

  // 通知が有効な場合のみWebhook URLをバリデーション
  if (settings.value.notificationEnabled) {
    slackWebhookValidation = validateSlackWebhookUrlFn(settings.value.slackWebhookUrl);
  }

  displayNameError.value = displayNameValidation;
  slackWebhookError.value = slackWebhookValidation;

  // バリデーションエラーがある場合は保存しない
  if (displayNameValidation || slackWebhookValidation) {
    return;
  }

  // エラーメッセージをクリア
  clearError();

  try {
    // 通知が無効の場合は強制的にWebhook URLを空文字にする
    const webhookUrl = settings.value.notificationEnabled ? settings.value.slackWebhookUrl : '';

    const success = await updateSettings({
      displayName: settings.value.displayName,
      slackWebhookUrl: webhookUrl,
      notificationEnabled: settings.value.notificationEnabled,
    });

    if (success) {
      successMessage.value = '設定を保存しました';
      clearValidationErrors();

      // 成功メッセージを3秒後に自動で消す
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    }
  } catch (err) {
    console.error('設定の保存に失敗しました:', err);
    // エラーはuseUserSettings内で設定されるため、ここでは追加処理不要
  }
};

/**
 * 設定リセットのハンドラ
 *
 * 実行タイミング: ユーザーが「リセット」ボタンをクリックした際
 * 処理内容:
 * 1. 設定値を元の状態（サーバーから取得した初期値）に戻す
 * 2. 全てのバリデーションエラーとメッセージをクリア
 */
const handleReset = (): void => {
  resetSettings();
  clearValidationErrors();
  clearMessages();
};

/**
 * 表示名バリデーションのハンドラ
 *
 * 実行タイミング: UserNameSectionコンポーネントからblurイベントが発火された際
 * 処理内容: 現在の表示名をバリデーションし、エラーがあれば表示用の状態に設定
 */
const validateDisplayName = (): void => {
  displayNameError.value = validateDisplayNameFn(settings.value.displayName);
};

/**
 * Slack Webhook URLバリデーションのハンドラ
 *
 * 実行タイミング: SlackWebhookSectionコンポーネントからblurイベントが発火された際
 * 処理内容:
 * 1. 通知が有効な場合のみWebhook URLをバリデーション
 * 2. 通知が無効な場合はエラーをクリア
 */
const validateSlackWebhook = (): void => {
  // 通知が有効な場合のみバリデーション
  if (settings.value.notificationEnabled) {
    slackWebhookError.value = validateSlackWebhookUrlFn(settings.value.slackWebhookUrl);
  } else {
    slackWebhookError.value = null;
  }
};

/**
 * Slack Webhook URLテストのハンドラ
 *
 * 実行タイミング: SlackWebhookSectionコンポーネントでテストボタンがクリックされた際
 * 処理内容:
 * 1. 指定されたWebhook URLにテスト送信を実行
 * 2. 成功時は結果オブジェクトを返す
 * 3. 失敗時は詳細なエラーメッセージを生成して返す
 */
const handleTestWebhook = async (
  webhookUrl: string,
): Promise<{ success: boolean; result?: TestSlackWebhookResponseDto; error?: string }> => {
  try {
    const result = await testSlackWebhook(webhookUrl);
    return { success: true, result };
  } catch (err) {
    console.error('Webhook テストエラー:', err);

    // より詳細なエラーメッセージを生成
    let errorMessage = 'テスト送信に失敗しました';

    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string }; status?: number } })
        .response;
      if (response?.data?.message) {
        errorMessage = `テストエラー: ${response.data.message}`;
      } else if (response?.status) {
        errorMessage = `テストエラー: HTTPステータス ${response.status}`;
      }
    } else if (err instanceof Error) {
      errorMessage = `テストエラー: ${err.message}`;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * エラーメッセージをクリア
 */
const clearError = (): void => {
  error.value = null;
};

/**
 * 成功メッセージをクリア
 */
const clearSuccessMessage = (): void => {
  successMessage.value = null;
};

/**
 * バリデーションエラーをクリア
 */
const clearValidationErrors = (): void => {
  displayNameError.value = null;
  slackWebhookError.value = null;
};

/**
 * 全てのメッセージをクリア
 */
const clearMessages = (): void => {
  clearError();
  clearSuccessMessage();
  clearValidationErrors();
};
</script>

<style scoped>
.settings-container {
  max-width: 800px;
}

.gap-2 {
  gap: 8px;
}

@media (max-width: 600px) {
  .settings-container {
    max-width: 100%;
  }

  .d-flex.justify-end {
    justify-content: stretch !important;
  }

  .d-flex.justify-end .v-btn {
    flex: 1;
  }
}
</style>
