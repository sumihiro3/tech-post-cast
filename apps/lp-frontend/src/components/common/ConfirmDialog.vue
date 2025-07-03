<template lang="pug">
v-dialog(
  :model-value="modelValue"
  :max-width="maxWidth"
  @update:model-value="$emit('update:modelValue', $event)"
)
  v-card(color="surface" rounded="lg")
    v-card-title.text-h6.font-weight-bold.bg-surface-light {{ title }}
    v-card-text.text-body-1 {{ message }}
    v-card-actions
      v-btn(
        :color="cancelButtonColor"
        variant="text"
        @click="$emit('update:modelValue', false)"
      ) {{ cancelButtonText }}
      v-spacer
      v-btn(
        :color="confirmButtonColor"
        variant="text"
        @click="onConfirm"
      ) {{ confirmButtonText }}
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '確認',
  },
  message: {
    type: String,
    required: true,
  },
  confirmButtonText: {
    type: String,
    default: 'OK',
  },
  cancelButtonText: {
    type: String,
    default: 'キャンセル',
  },
  confirmButtonColor: {
    type: String,
    default: 'primary',
  },
  cancelButtonColor: {
    type: String,
    default: 'secondary',
  },
  maxWidth: {
    type: String,
    default: '500px',
  },
});

// defineEmits(['update:modelValue', 'confirm']);

// 確認ボタンのクリックハンドラ
const onConfirm = (): void => {
  // 親コンポーネントへconfirmイベントを発火
  emit('confirm');
  // ダイアログを閉じる
  emit('update:modelValue', false);
};

// 型付きのemit関数
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();
</script>
