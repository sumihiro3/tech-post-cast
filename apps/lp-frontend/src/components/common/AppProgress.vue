<template lang="pug">
//- プログレスサークルとオーバーレイ
div(v-if="isVisible")
  //- 半透明オーバーレイ（操作不可）
  .progress-overlay(
    v-if="overlay"
    @click.prevent="() => {}"
  )

  //- プログレスサークルと表示テキスト
  .progress-container
    v-progress-circular(
      :indeterminate="indeterminate"
      :color="color"
      :size="size"
    )
    .progress-text.mt-3(v-if="text") {{ text }}
</template>

<script setup lang="ts">
import { progress } from '@/composables/useProgress';
import { computed } from 'vue';

// クライアントサイドかどうかをチェック
const isClient = typeof window !== 'undefined';

// グローバルなprogressのプロパティを参照
const isVisible = computed(() => isClient && progress.isVisible.value);
const text = computed(() => (isClient ? progress.text.value : ''));
const color = computed(() => (isClient ? progress.color.value : 'primary'));
const size = computed(() => (isClient ? progress.size.value : 70));
const indeterminate = computed(() => (isClient ? progress.indeterminate.value : true));
const overlay = computed(() => (isClient ? progress.overlay.value : true));
</script>

<style scoped>
.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10000;
}

.progress-text {
  color: #333;
  font-size: 1rem;
  text-align: center;
}
</style>
