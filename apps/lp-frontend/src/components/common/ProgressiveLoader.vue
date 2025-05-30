<template lang="pug">
v-card(v-if="isLoading" elevation="2" class="progressive-loader")
  v-card-text
    //- 進捗バー
    .mb-4
      .d-flex.justify-space-between.align-center.mb-2
        .text-subtitle-1.font-weight-medium {{ currentMessage }}
        .text-caption.text-medium-emphasis {{ progress }}%

      v-progress-linear(
        :model-value="progress"
        color="primary"
        height="8"
        rounded
        striped
      )

    //- 推定残り時間
    .text-caption.text-center.text-medium-emphasis(v-if="estimatedTimeRemaining > 0")
      | 推定残り時間: {{ formatTime(estimatedTimeRemaining) }}

    //- ステップ詳細（詳細表示モード）
    v-expansion-panels(v-if="showDetails" variant="accordion" class="mt-4")
      v-expansion-panel(title="処理詳細")
        v-expansion-panel-text
          v-list(density="compact")
            v-list-item(
              v-for="step in steps"
              :key="step.id"
              :class="getStepClass(step)"
            )
              template(#prepend)
                v-icon(
                  :icon="getStepIcon(step)"
                  :color="getStepColor(step)"
                  size="small"
                )

              v-list-item-title {{ step.name }}
              v-list-item-subtitle(v-if="step.description") {{ step.description }}

              template(#append)
                .text-caption.text-medium-emphasis(v-if="step.endTime && step.startTime")
                  | {{ formatDuration(step.endTime.getTime() - step.startTime.getTime()) }}

    //- アクションボタン
    .d-flex.justify-center.mt-4(v-if="showActions")
      v-btn(
        v-if="currentStep?.error"
        variant="outlined"
        color="primary"
        size="small"
        @click="$emit('retry')"
      ) 再試行

      v-btn(
        variant="text"
        color="secondary"
        size="small"
        @click="$emit('cancel')"
      ) キャンセル
</template>

<script setup lang="ts">
import type { LoadingStep } from '@/composables/loading/useProgressiveLoading';

interface Props {
  /** 現在のステップ */
  currentStep: LoadingStep | null;
  /** 全ステップ */
  steps: LoadingStep[];
  /** ローディング中フラグ */
  isLoading: boolean;
  /** 進捗率（0-100） */
  progress: number;
  /** 推定残り時間（ミリ秒） */
  estimatedTimeRemaining: number;
  /** 現在のステップメッセージ */
  currentMessage: string;
  /** 詳細表示するか */
  showDetails?: boolean;
  /** アクションボタンを表示するか */
  showActions?: boolean;
}

interface Emits {
  (e: 'retry' | 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  showActions: true,
});

defineEmits<Emits>();

/**
 * ステップのクラスを取得
 */
const getStepClass = (step: LoadingStep): string => {
  if (step.error) return 'text-error';
  if (step.completed) return 'text-success';
  if (props.currentStep?.id === step.id) return 'text-primary font-weight-medium';
  return 'text-medium-emphasis';
};

/**
 * ステップのアイコンを取得
 */
const getStepIcon = (step: LoadingStep): string => {
  if (step.error) return 'mdi-alert-circle';
  if (step.completed) return 'mdi-check-circle';
  if (props.currentStep?.id === step.id) return 'mdi-loading mdi-spin';
  return 'mdi-circle-outline';
};

/**
 * ステップの色を取得
 */
const getStepColor = (step: LoadingStep): string => {
  if (step.error) return 'error';
  if (step.completed) return 'success';
  if (props.currentStep?.id === step.id) return 'primary';
  return 'grey';
};

/**
 * 時間をフォーマット
 */
const formatTime = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
};

/**
 * 期間をフォーマット
 */
const formatDuration = (milliseconds: number): string => {
  const seconds = Math.round((milliseconds / 1000) * 10) / 10;
  return `${seconds}秒`;
};
</script>

<style scoped>
.progressive-loader {
  max-width: 500px;
  margin: 0 auto;
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
