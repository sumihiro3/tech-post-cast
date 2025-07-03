<template lang="pug">
v-card(
  :color="color"
  dark
  class="text-center pa-2 pa-sm-3 pa-md-4 stats-card"
  elevation="4"
  :class="{ 'cursor-pointer': clickable }"
  @click="handleClick"
)
  v-icon(:size="$vuetify.display.mobile ? 36 : 48" class="mb-2") {{ icon }}
  .text-h5.text-sm-h4.font-weight-bold.mb-1 {{ value }}
  .text-body-1.text-sm-subtitle-1 {{ title }}
  .text-caption(v-if="subtitle") {{ subtitle }}
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  clickable?: boolean;
}

interface Emits {
  (e: 'click'): void;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  clickable: false,
});

const emit = defineEmits<Emits>();

const handleClick = (): void => {
  if (props.clickable) {
    emit('click');
  }
};
</script>

<style scoped>
.stats-card {
  border-radius: 12px;
  transition: transform 0.2s ease-in-out;
}

.stats-card.cursor-pointer:hover {
  transform: translateY(-2px);
  cursor: pointer;
}
</style>
