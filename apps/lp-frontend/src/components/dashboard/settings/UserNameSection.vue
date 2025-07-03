<template lang="pug">
v-card.mb-6(elevation="2")
  v-card-title.d-flex.align-center
    v-icon.mr-3(color="primary" :size="$vuetify.display.mobile ? 'default' : 'large'") mdi-account-edit
    span.text-subtitle-1.text-sm-h6 表示名設定
  v-card-text
    p.text-body-2.text-medium-emphasis.mb-4
      | パーソナルプログラム内で使用される表示名を設定してください。
    v-text-field(
      v-model="localDisplayName"
      label="表示名"
      placeholder="例: 田中太郎"
      :error-messages="displayNameError"
      :disabled="disabled"
      variant="outlined"
      density="comfortable"
      counter="50"
      maxlength="50"
      prepend-inner-icon="mdi-account"
      @blur="handleBlur"
      @input="handleInput"
    )
      template(#details)
        .text-caption.text-medium-emphasis
          | プログラム内でのナレーションや表示で使用されます
</template>

<script setup lang="ts">
/**
 * UserNameSectionコンポーネントのProps
 */
interface Props {
  /** 表示名 - v-modelで双方向バインディングされる現在の表示名 */
  modelValue: string;
  /** エラーメッセージ - 親コンポーネントでのバリデーションエラーメッセージ */
  error?: string | null;
  /** 無効化フラグ - コンポーネント全体を無効化するかどうか（ローディング中など） */
  disabled?: boolean;
}

/**
 * UserNameSectionコンポーネントのEmits
 */
interface Emits {
  /** 表示名更新イベント - ユーザーが表示名を入力・変更した際に発火（v-modelの更新） */
  (e: 'update:modelValue', value: string): void;
  /** フォーカス離脱イベント - 表示名入力フィールドからフォーカスが離れた際に発火（バリデーション実行のトリガー） */
  (e: 'blur'): void;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  disabled: false,
});

const emit = defineEmits<Emits>();

// ローカル状態管理
const localDisplayName = ref<string>(props.modelValue);

// エラー表示の計算プロパティ
const displayNameError = computed(() => {
  if (props.error) {
    return [props.error];
  }
  return [];
});

// 親コンポーネントからの値の変更を監視
watch(
  () => props.modelValue,
  (newValue) => {
    localDisplayName.value = newValue;
  },
);

// 入力値の変更を親に通知
watch(localDisplayName, (newValue) => {
  emit('update:modelValue', newValue);
});

/**
 * 入力フィールドのblurイベントハンドラ
 *
 * 実行タイミング: 表示名入力フィールドからフォーカスが離れた際
 * 処理内容: 親コンポーネントにblurイベントを通知（バリデーション実行のトリガー）
 */
const handleBlur = (): void => {
  emit('blur');
};

/**
 * 入力値変更のハンドラ
 *
 * 実行タイミング: ユーザーが表示名を入力している際
 * 処理内容: watchによるリアルタイム更新のため、特別な処理は不要
 */
const handleInput = (): void => {
  // リアルタイムでの値更新は watch で処理
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-title {
  padding: 12px 12px 8px;
  font-weight: 600;
}

@media (min-width: 600px) {
  .v-card-title {
    padding: 16px 20px 12px;
  }
}

@media (min-width: 960px) {
  .v-card-title {
    padding: 20px 24px 16px;
  }
}

.v-card-text {
  padding: 0 12px 12px;
}

@media (min-width: 600px) {
  .v-card-text {
    padding: 0 20px 20px;
  }
}

@media (min-width: 960px) {
  .v-card-text {
    padding: 0 24px 24px;
  }
}
</style>
