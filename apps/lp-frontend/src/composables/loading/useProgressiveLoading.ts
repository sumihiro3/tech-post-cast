/**
 * 段階的ローディング表示用composable
 */

import { computed, ref, type Ref } from 'vue';

export interface LoadingStep {
  /** ステップID */
  id: string;
  /** ステップ名 */
  name: string;
  /** 説明 */
  description?: string;
  /** 推定時間（ミリ秒） */
  estimatedDuration?: number;
  /** 完了フラグ */
  completed: boolean;
  /** エラーフラグ */
  error: boolean;
  /** 開始時刻 */
  startTime?: Date;
  /** 終了時刻 */
  endTime?: Date;
}

export interface UseProgressiveLoadingReturn {
  /** 現在のステップ */
  currentStep: Ref<LoadingStep | null>;
  /** 全ステップ */
  steps: Ref<LoadingStep[]>;
  /** ローディング中フラグ */
  isLoading: Ref<boolean>;
  /** 進捗率（0-100） */
  progress: Ref<number>;
  /** 推定残り時間（ミリ秒） */
  estimatedTimeRemaining: Ref<number>;
  /** ステップを追加 */
  addStep: (step: Omit<LoadingStep, 'completed' | 'error'>) => void;
  /** ステップを開始 */
  startStep: (stepId: string) => void;
  /** ステップを完了 */
  completeStep: (stepId: string) => void;
  /** ステップをエラーにする */
  errorStep: (stepId: string, error?: string) => void;
  /** 全体を開始 */
  start: () => void;
  /** 全体を完了 */
  complete: () => void;
  /** 全体をリセット */
  reset: () => void;
  /** 現在のステップメッセージ */
  currentMessage: Ref<string>;
}

/**
 * 段階的ローディング表示用composable
 */
export const useProgressiveLoading = (): UseProgressiveLoadingReturn => {
  const currentStep = ref<LoadingStep | null>(null);
  const steps = ref<LoadingStep[]>([]);
  const isLoading = ref(false);

  /**
   * 進捗率を計算
   */
  const progress = computed(() => {
    if (steps.value.length === 0) return 0;

    const completedSteps = steps.value.filter((step) => step.completed).length;
    return Math.round((completedSteps / steps.value.length) * 100);
  });

  /**
   * 推定残り時間を計算
   */
  const estimatedTimeRemaining = computed(() => {
    if (!isLoading.value || steps.value.length === 0) return 0;

    const remainingSteps = steps.value.filter((step) => !step.completed && !step.error);
    const totalEstimatedTime = remainingSteps.reduce(
      (total, step) => total + (step.estimatedDuration || 1000),
      0,
    );

    // 現在のステップの残り時間も考慮
    if (currentStep.value && currentStep.value.startTime && currentStep.value.estimatedDuration) {
      const elapsed = Date.now() - currentStep.value.startTime.getTime();
      const remaining = Math.max(0, currentStep.value.estimatedDuration - elapsed);
      return totalEstimatedTime + remaining;
    }

    return totalEstimatedTime;
  });

  /**
   * 現在のステップメッセージ
   */
  const currentMessage = computed(() => {
    if (!currentStep.value) {
      if (isLoading.value) {
        return '処理中...';
      }
      return '';
    }

    const step = currentStep.value;
    if (step.error) {
      return `エラー: ${step.name}`;
    }

    if (step.description) {
      return `${step.name} - ${step.description}`;
    }

    return step.name;
  });

  /**
   * ステップを追加
   */
  const addStep = (step: Omit<LoadingStep, 'completed' | 'error'>): void => {
    steps.value.push({
      ...step,
      completed: false,
      error: false,
    });
  };

  /**
   * ステップを開始
   */
  const startStep = (stepId: string): void => {
    const step = steps.value.find((s) => s.id === stepId);
    if (!step) return;

    step.startTime = new Date();
    step.completed = false;
    step.error = false;
    currentStep.value = step;
  };

  /**
   * ステップを完了
   */
  const completeStep = (stepId: string): void => {
    const step = steps.value.find((s) => s.id === stepId);
    if (!step) return;

    step.completed = true;
    step.endTime = new Date();

    // 次のステップがあれば自動的に開始
    const currentIndex = steps.value.findIndex((s) => s.id === stepId);
    const nextStep = steps.value[currentIndex + 1];

    if (nextStep && !nextStep.completed && !nextStep.error) {
      startStep(nextStep.id);
    } else {
      currentStep.value = null;
    }
  };

  /**
   * ステップをエラーにする
   */
  const errorStep = (stepId: string, errorMessage?: string): void => {
    const step = steps.value.find((s) => s.id === stepId);
    if (!step) return;

    step.error = true;
    step.endTime = new Date();

    if (errorMessage) {
      step.description = errorMessage;
    }

    currentStep.value = step;
  };

  /**
   * 全体を開始
   */
  const start = (): void => {
    isLoading.value = true;

    // 最初のステップを開始
    const firstStep = steps.value[0];
    if (firstStep) {
      startStep(firstStep.id);
    }
  };

  /**
   * 全体を完了
   */
  const complete = (): void => {
    isLoading.value = false;
    currentStep.value = null;

    // 未完了のステップを完了にする
    steps.value.forEach((step) => {
      if (!step.completed && !step.error) {
        step.completed = true;
        step.endTime = new Date();
      }
    });
  };

  /**
   * 全体をリセット
   */
  const reset = (): void => {
    isLoading.value = false;
    currentStep.value = null;
    steps.value = [];
  };

  return {
    currentStep,
    steps,
    isLoading,
    progress,
    estimatedTimeRemaining,
    addStep,
    startStep,
    completeStep,
    errorStep,
    start,
    complete,
    reset,
    currentMessage,
  };
};
