<template lang="pug">
v-card.mb-6(elevation="2")
  v-card-title.d-flex.align-center
    v-icon.mr-3(color="primary") mdi-rss
    | RSS設定
  v-card-text
    p.text-body-2.text-medium-emphasis.mb-4
      | パーソナルプログラムをポッドキャストアプリで聴くためのRSS配信設定です。

    // RSS機能有効化スイッチ
    v-switch(
      v-model="localRssEnabled"
      label="RSS配信を有効にする"
      :disabled="disabled"
      color="primary"
      hide-details
      @change="handleRssEnabledChange"
    )
      template(#details)
        .text-caption.text-medium-emphasis.mt-2
          | RSS配信を有効にすると、ポッドキャストアプリでパーソナルプログラムを聴くことができます

    // RSS URL表示（RSS有効時のみ）
    v-expand-transition
      div(v-if="localRssEnabled && rssUrl")
        v-divider.my-4

        .mb-4
          .text-subtitle-2.mb-2 RSS URL
          .d-flex.align-center.ga-2
            v-text-field(
              :model-value="rssUrl"
              variant="outlined"
              density="comfortable"
              readonly
              prepend-inner-icon="mdi-rss"
              hide-details
            )
            v-btn(
              icon="mdi-content-copy"
              variant="outlined"
              size="small"
              :disabled="!rssUrl"
              @click="copyRssUrl"
            )
              v-icon mdi-content-copy
              v-tooltip(activator="parent" location="top")
                | RSS URLをコピー
          .text-caption.text-medium-emphasis.mt-1
            | このURLをポッドキャストアプリに登録してください

        // トークン再生成ボタン
        .d-flex.justify-space-between.align-center
          div
            .text-subtitle-2 セキュリティトークン
            .text-caption.text-medium-emphasis
              | セキュリティ上の理由でURLを変更したい場合は、新しいトークンを生成できます
          v-btn(
            :loading="regenerating"
            :disabled="disabled"
            color="warning"
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="handleRegenerateToken"
          ) トークン再生成

    // RSS無効時の説明
    v-expand-transition
      div(v-if="!localRssEnabled")
        v-divider.my-4
        v-alert(
          type="info"
          variant="tonal"
          density="compact"
        )
          template(#prepend)
            v-icon mdi-information
          .text-body-2
            | RSS配信を有効にすると、以下のポッドキャストアプリでパーソナルプログラムを聴くことができます：
          .mt-2
            v-chip.mr-2.mb-1(
              v-for="app in podcastApps"
              :key="app.name"
              size="small"
              variant="outlined"
            ) {{ app.name }}
</template>

<script setup lang="ts">
import type { RegenerateRssTokenResponseDto } from '@/api';

/**
 * RssSettingsSectionコンポーネントのProps
 */
interface Props {
  /** RSS機能有効フラグ - v-modelで双方向バインディングされる現在のRSS機能有効状態 */
  modelValue: boolean;
  /** RSS URL - RSS配信URL（RSS機能が有効な場合のみ） */
  rssUrl?: string;
  /** 無効化フラグ - コンポーネント全体を無効化するかどうか（ローディング中など） */
  disabled?: boolean;
  /** トークン再生成関数 - RSSトークンを再生成する関数 */
  onRegenerateToken?: () => Promise<RegenerateRssTokenResponseDto>;
}

/**
 * RssSettingsSectionコンポーネントのEmits
 */
interface Emits {
  /** RSS機能有効状態更新イベント - ユーザーがRSS機能の有効/無効を切り替えた際に発火（v-modelの更新） */
  (e: 'update:modelValue', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  rssUrl: undefined,
  disabled: false,
  onRegenerateToken: undefined,
});

const emit = defineEmits<Emits>();

// ローカル状態管理
const localRssEnabled = ref<boolean>(props.modelValue);
const regenerating = ref<boolean>(false);

// 対応ポッドキャストアプリ一覧
const podcastApps = ref([
  { name: 'Apple Podcasts' },
  { name: 'YouTube Music' },
  { name: 'Overcast' },
  { name: 'Pocket Casts' },
]);

// 親コンポーネントからの値の変更を監視
watch(
  () => props.modelValue,
  (newValue) => {
    localRssEnabled.value = newValue;
  },
);

// 入力値の変更を親に通知
watch(localRssEnabled, (newValue) => {
  emit('update:modelValue', newValue);
});

/**
 * RSS機能有効化状態変更のハンドラ
 *
 * 実行タイミング: ユーザーがRSS機能の有効/無効スイッチを切り替えた際
 * 処理内容: 親コンポーネントに変更を通知
 */
const handleRssEnabledChange = (): void => {
  // watchによるリアルタイム更新のため、特別な処理は不要
};

/**
 * RSS URLコピーのハンドラ
 *
 * 実行タイミング: ユーザーがRSS URLのコピーボタンをクリックした際
 * 処理内容: RSS URLをクリップボードにコピーし、成功メッセージを表示
 */
const copyRssUrl = async (): Promise<void> => {
  if (!props.rssUrl) return;

  try {
    await navigator.clipboard.writeText(props.rssUrl);

    // 成功メッセージを表示（useUIStateを使用）
    const ui = useUIState();
    ui.showSuccess('RSS URLをクリップボードにコピーしました');
  } catch (err) {
    console.error('RSS URLのコピーに失敗しました:', err);

    // フォールバック: 古いブラウザ対応
    try {
      // テキストエリアを使用したフォールバック方法
      const textArea = document.createElement('textarea');
      textArea.value = props.rssUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      // 成功メッセージを表示
      const ui = useUIState();
      ui.showSuccess('RSS URLをクリップボードにコピーしました');
    } catch (fallbackErr) {
      console.error('フォールバックコピーも失敗しました:', fallbackErr);

      // エラーメッセージを表示
      const ui = useUIState();
      ui.showError('RSS URLのコピーに失敗しました。手動でURLをコピーしてください。');
    }
  }
};

/**
 * RSSトークン再生成のハンドラ
 *
 * 実行タイミング: ユーザーがトークン再生成ボタンをクリックした際
 * 処理内容:
 * 1. 確認ダイアログを表示
 * 2. ユーザーが確認した場合、トークン再生成を実行
 * 3. 成功時は成功メッセージを表示
 */
const handleRegenerateToken = async (): Promise<void> => {
  if (!props.onRegenerateToken) return;

  // 確認ダイアログを表示
  const confirmed = confirm(
    'RSSトークンを再生成すると、現在のRSS URLが無効になります。\n' +
      'ポッドキャストアプリに登録済みの場合は、新しいURLで再登録が必要です。\n\n' +
      '続行しますか？',
  );

  if (!confirmed) return;

  regenerating.value = true;

  try {
    const result = await props.onRegenerateToken();

    // 成功メッセージを表示（useUIStateを使用）
    const ui = useUIState();
    ui.showSuccess('RSSトークンを再生成しました。新しいURLをご利用ください。');

    console.log('RSSトークン再生成成功:', result);
  } catch (err) {
    console.error('RSSトークン再生成エラー:', err);

    // エラーメッセージを表示
    const ui = useUIState();
    ui.showError('RSSトークンの再生成に失敗しました');
  } finally {
    regenerating.value = false;
  }
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

.v-chip {
  font-size: 0.75rem;
}
</style>
