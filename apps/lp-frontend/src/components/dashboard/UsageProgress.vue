<template lang="pug">
.mb-4
  .d-flex.justify-space-between.mb-2
    span {{ label }}
    span {{ current }}/{{ limit }}
  v-progress-linear(
    :model-value="percentage"
    :color="progressColor"
    height="8"
    rounded
  )
  .text-caption.text-grey.mt-1(v-if="showPercentage") {{ Math.round(percentage) }}% 使用中
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  current: number;
  limit: number;
  showPercentage?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showPercentage: false,
  warningThreshold: 70,
  dangerThreshold: 90,
});

const percentage = computed((): number => {
  return (props.current / props.limit) * 100;
});

const progressColor = computed((): string => {
  const percent = percentage.value;
  if (percent >= props.dangerThreshold) {
    return 'error';
  } else if (percent >= props.warningThreshold) {
    return 'warning';
  } else {
    return 'primary';
  }
});
</script>

<style scoped>
/* 使用量プログレス固有のスタイルがあれば追加 */
</style>
