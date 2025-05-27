<template lang="pug">
v-card.mb-6(elevation="2")
  v-card-title.d-flex.align-center
    v-icon.mr-3(color="primary") mdi-slack
    | Slack通知設定
  v-card-text
    p.text-body-2.text-medium-emphasis.mb-4
      | 番組生成完了時にSlackに通知を送信するためのWebhook URLを設定してください。

    v-alert.mb-4(
      v-if="localNotificationEnabled && !localWebhookUrl.trim()"
      type="warning"
      variant="tonal"
      density="compact"
    )
      template(#prepend)
        v-icon mdi-alert
      | Slack通知を有効にする場合はWebhook URLの設定が必要です。

    v-alert.mb-4(
      v-if="!localNotificationEnabled && localWebhookUrl.trim()"
      type="info"
      variant="tonal"
      density="compact"
    )
      template(#prepend)
        v-icon mdi-information
      | 通知を無効にすると、設定されているWebhook URLは削除されます。

    // 通知有効/無効の切り替え
    v-switch(
      v-model="localNotificationEnabled"
      label="Slack通知を有効にする"
      :disabled="disabled"
      color="primary"
      hide-details
      @change="handleNotificationToggle"
    )
      template(#details)
        .text-caption.text-medium-emphasis
          | 通知を無効にすると、Webhook URLは自動的に削除されます

    // Webhook URL入力フィールド
    v-text-field(
      v-model="localWebhookUrl"
      label="Slack Webhook URL"
      placeholder="https://hooks.slack.com/services/..."
      :error-messages="webhookUrlError"
      :disabled="disabled || !localNotificationEnabled"
      :required="localNotificationEnabled"
      variant="outlined"
      density="comfortable"
      prepend-inner-icon="mdi-link"
      @blur="handleBlur"
      @input="handleInput"
    )
      template(#details)
        .text-caption.text-medium-emphasis
          | SlackのIncoming Webhooksで取得したURLを入力してください

    // テストボタンとステータス表示
    .mt-4(v-if="localWebhookUrl")
      v-btn(
        :loading="testing"
        :disabled="disabled || !localWebhookUrl || !!webhookValidationError"
        variant="outlined"
        color="primary"
        prepend-icon="mdi-send"
        size="small"
        @click="handleTestWebhook"
      ) テスト送信

      // バリデーションエラー表示
      v-alert.mt-3(
        v-if="webhookValidationError"
        type="warning"
        variant="tonal"
        density="compact"
      )
        template(#prepend)
          v-icon mdi-alert
        | {{ webhookValidationError }}

      // テスト結果表示
      v-alert.mt-3(
        v-if="testResult"
        :type="testResult.success ? 'success' : 'error'"
        variant="tonal"
        density="compact"
      )
        template(#prepend)
          v-icon {{ testResult.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        | {{ testResult.success ? 'テスト送信が成功しました' : (testResult.errorMessage || 'テスト送信に失敗しました') }}

      // テストエラー表示
      v-alert.mt-3(
        v-if="testError"
        type="error"
        variant="tonal"
        density="compact"
      )
        template(#prepend)
          v-icon mdi-alert-circle
        | {{ testError }}
</template>

<script setup lang="ts">
import type { TestSlackWebhookResponseDto } from '@/api';

/**
 * SlackWebhookSectionコンポーネントのProps
 */
interface Props {
  /** Slack Webhook URL - 親コンポーネントから渡される現在のWebhook URL */
  webhookUrl: string;
  /** 通知有効フラグ - Slack通知が有効かどうかを示すフラグ */
  notificationEnabled: boolean;
  /** エラーメッセージ - 親コンポーネントでのバリデーションエラーメッセージ */
  error?: string | null;
  /** 無効化フラグ - コンポーネント全体を無効化するかどうか（ローディング中など） */
  disabled?: boolean;
  /** Webhook URLテスト関数 - 親コンポーネントから渡されるテスト実行関数 */
  onTestWebhook?: (
    webhookUrl: string,
  ) => Promise<{ success: boolean; result?: TestSlackWebhookResponseDto; error?: string }>;
}

/**
 * SlackWebhookSectionコンポーネントのEmits
 */
interface Emits {
  /** Webhook URL更新イベント - ユーザーがWebhook URLを入力・変更した際に発火 */
  (e: 'update:webhookUrl', value: string): void;
  /** 通知有効フラグ更新イベント - ユーザーが通知スイッチを切り替えた際に発火 */
  (e: 'update:notificationEnabled', value: boolean): void;
  /** フォーカス離脱イベント - Webhook URL入力フィールドからフォーカスが離れた際に発火（バリデーション実行のトリガー） */
  (e: 'blur'): void;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  disabled: false,
});

const emit = defineEmits<Emits>();

// ローカル状態管理
const localWebhookUrl = ref<string>(props.webhookUrl);
const localNotificationEnabled = ref<boolean>(props.notificationEnabled);

// テスト関連の状態
const testing = ref<boolean>(false);
const testResult = ref<TestSlackWebhookResponseDto | null>(null);
const testError = ref<string | null>(null);

// エラー表示の計算プロパティ
const webhookUrlError = computed(() => {
  if (props.error) {
    return [props.error];
  }
  return [];
});

// Webhook URLのバリデーションエラーの計算プロパティ
const webhookValidationError = computed(() => {
  if (!localWebhookUrl.value || localWebhookUrl.value.trim() === '') {
    return null;
  }
  return validateWebhookUrl(localWebhookUrl.value);
});

// 親コンポーネントからの値の変更を監視
watch(
  () => props.webhookUrl,
  (newValue) => {
    localWebhookUrl.value = newValue;
  },
);

watch(
  () => props.notificationEnabled,
  (newValue) => {
    localNotificationEnabled.value = newValue;
  },
);

// 入力値の変更を親に通知
watch(localWebhookUrl, (newValue) => {
  emit('update:webhookUrl', newValue);
  // URL変更時はテスト結果をクリア
  clearTestResult();
});

watch(localNotificationEnabled, (newValue) => {
  // 通知が無効になった場合はWebhook URLをクリア
  if (!newValue && localWebhookUrl.value.trim()) {
    localWebhookUrl.value = '';
    emit('update:webhookUrl', '');
  }

  emit('update:notificationEnabled', newValue);
});

/**
 * 入力フィールドのblurイベントハンドラ
 *
 * 実行タイミング: Webhook URL入力フィールドからフォーカスが離れた際
 * 処理内容: 親コンポーネントにblurイベントを通知（バリデーション実行のトリガー）
 */
const handleBlur = (): void => {
  emit('blur');
};

/**
 * 入力値変更のハンドラ
 *
 * 実行タイミング: ユーザーがWebhook URLを入力している際
 * 処理内容: watchによるリアルタイム更新のため、特別な処理は不要
 */
const handleInput = (): void => {
  // リアルタイムでの値更新は watch で処理
};

/**
 * 通知有効/無効切り替えのハンドラ
 *
 * 実行タイミング: ユーザーが通知スイッチを切り替えた際
 * 処理内容: watchによる自動処理のため、特別な処理は不要
 */
const handleNotificationToggle = (): void => {
  // watch で処理されるため、特別な処理は不要
};

/**
 * Webhook URLテストのハンドラ
 *
 * 実行タイミング: ユーザーが「テスト送信」ボタンをクリックした際
 * 処理内容:
 * 1. Webhook URLの事前バリデーション実行
 * 2. バリデーション通過後、親コンポーネントのテスト関数を呼び出し
 * 3. 結果に応じてテスト結果またはエラーメッセージを表示
 */
const handleTestWebhook = async (): Promise<void> => {
  if (!localWebhookUrl.value || !props.onTestWebhook) {
    return;
  }

  // テスト前にWebhook URLをバリデーション
  const validationError = validateWebhookUrl(localWebhookUrl.value);
  if (validationError) {
    testError.value = validationError;
    return;
  }

  testing.value = true;
  clearTestResult();

  try {
    const result = await props.onTestWebhook(localWebhookUrl.value);

    if (result.success && result.result) {
      testResult.value = result.result;
    } else if (result.error) {
      testError.value = result.error;
    }
  } catch (error) {
    console.error('Webhook テストエラー:', error);
    testError.value = 'テスト送信中にエラーが発生しました';
  } finally {
    testing.value = false;
  }
};

/**
 * Webhook URLのバリデーション関数
 *
 * 実行タイミング: テスト送信前、またはリアルタイムバリデーション時
 * 処理内容:
 * 1. 空文字チェック
 * 2. HTTPS形式チェック
 * 3. Slackドメイン（hooks.slack.com）チェック
 * 4. パス構造（/services/で始まる）チェック
 * 5. ワークスペースID（Tで始まる）とボットID（Bで始まる）の存在チェック
 *
 * @param url - 検証するWebhook URL
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
const validateWebhookUrl = (url: string): string | null => {
  // 空文字チェック
  if (!url || url.trim() === '') {
    return 'Webhook URLを入力してください';
  }

  // URL形式の基本チェック
  try {
    const urlObj = new URL(url);

    // プロトコルチェック
    if (urlObj.protocol !== 'https:') {
      return 'Webhook URLはHTTPS形式である必要があります';
    }

    // Slack Webhook URLの形式チェック
    if (!urlObj.hostname.includes('hooks.slack.com')) {
      return '正しいSlack Webhook URLを入力してください（hooks.slack.comドメインが必要です）';
    }

    if (!urlObj.pathname.startsWith('/services/')) {
      return '正しいSlack Webhook URLを入力してください（/services/で始まるパスが必要です）';
    }

    // パスの構造チェック（/services/T.../B.../...の形式）
    const pathParts = urlObj.pathname.split('/');
    if (pathParts.length < 5 || pathParts[1] !== 'services') {
      return '正しいSlack Webhook URLを入力してください（正しいパス構造が必要です）';
    }

    // Tで始まるワークスペースIDとBで始まるボットIDの存在チェック
    const workspaceId = pathParts[2];
    const botId = pathParts[3];

    if (!workspaceId.startsWith('T') || workspaceId.length < 8) {
      return '正しいSlack Webhook URLを入力してください（有効なワークスペースIDが必要です）';
    }

    if (!botId.startsWith('B') || botId.length < 8) {
      return '正しいSlack Webhook URLを入力してください（有効なボットIDが必要です）';
    }

    return null;
  } catch {
    return '正しいURL形式で入力してください';
  }
};

/**
 * テスト結果をクリア
 *
 * 実行タイミング:
 * - Webhook URLが変更された際
 * - 新しいテスト送信を開始する前
 * 処理内容: テスト結果とエラーメッセージの状態をリセット
 */
const clearTestResult = (): void => {
  testResult.value = null;
  testError.value = null;
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-title {
  padding: 20px 24px 16px;
  font-weight: 600;
}

.v-card-text {
  padding: 0 24px 24px;
}

.v-switch {
  margin-top: 8px;
}
</style>
