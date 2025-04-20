<template lang="pug">
v-snackbar(
  v-model="isVisible"
  :color="snackbarColor"
  :timeout="timeout"
  :location="position"
)
  .d-flex.align-center
    v-icon.mr-2(:icon="snackbarIcon")
    span {{ text }}
  template(#actions)
    v-btn(
      color="white"
      icon="mdi-close"
      variant="text"
      @click="close"
    )
</template>

<script setup lang="ts">
import { snackbar } from '@/composables/useSnackbar';
import { computed } from 'vue';

// composableが定義されているかチェック（SSR対策）
const isClient = typeof window !== 'undefined';

// グローバルなsnackbarのプロパティを参照
const isVisible = computed({
  get: () => (isClient ? snackbar.isVisible.value : false),
  set: (value) => {
    if (isClient && !value) {
      snackbar.close();
    }
  },
});
const text = computed(() => (isClient ? snackbar.text.value : ''));
const type = computed(() => (isClient ? snackbar.type.value : 'info'));
const timeout = computed(() => (isClient ? snackbar.timeout.value : 10 * 1000));
const position = computed(() => (isClient ? snackbar.position.value : 'top'));
// タイプに応じた色を返す
const snackbarColor = computed(() => {
  switch (type.value) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
});

// タイプに応じたアイコンを返す
const snackbarIcon = computed(() => {
  switch (type.value) {
    case 'success':
      return 'mdi-check-circle';
    case 'error':
      return 'mdi-alert-circle';
    case 'warning':
      return 'mdi-alert';
    case 'info':
    default:
      return 'mdi-information';
  }
});

// Snackbarを閉じる
const close = () => {
  snackbar.close();
};
</script>

<style scoped></style>
