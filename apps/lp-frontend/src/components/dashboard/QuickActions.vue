<template lang="pug">
SectionCard(
  :title="title"
  :icon="icon"
  :class="containerClass"
)
  template(#actions)
    slot(name="actions")

  v-card-text
    v-btn(
      v-for="action in actions"
      :key="action.title"
      :color="action.color"
      :disabled="action.disabled"
      block
      class="mb-2"
      @click="handleActionClick(action)"
    )
      v-icon.mr-2 {{ action.icon }}
      | {{ action.title }}
      v-chip.ml-2(
        v-if="action.badge"
        :color="action.badgeColor || 'secondary'"
        size="x-small"
      ) {{ action.badge }}
</template>

<script setup lang="ts">
import SectionCard from './SectionCard.vue';

interface QuickAction {
  title: string;
  icon: string;
  color: string;
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
  action?: () => void;
}

interface Props {
  title?: string;
  icon?: string;
  actions: QuickAction[];
  containerClass?: string;
}

interface Emits {
  (e: 'action-click', action: QuickAction): void;
}

withDefaults(defineProps<Props>(), {
  title: 'クイックアクション',
  icon: 'mdi-lightning-bolt',
  containerClass: '',
});

const emit = defineEmits<Emits>();

const handleActionClick = (action: QuickAction): void => {
  if (!action.disabled && action.action) {
    action.action();
  }
  emit('action-click', action);
};
</script>

<style scoped>
/* クイックアクション固有のスタイルがあれば追加 */
</style>
