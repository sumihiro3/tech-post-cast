<template lang="pug">
v-row.mb-6
  v-col(
    v-for="stat in stats"
    :key="stat.title"
    cols="12"
    sm="4"
    md="4"
  )
    StatsCard(
      :title="stat.title"
      :value="stat.value"
      :icon="stat.icon"
      :color="stat.color"
      :subtitle="stat.subtitle"
      :clickable="stat.clickable"
      @click="handleStatClick(stat)"
    )
</template>

<script setup lang="ts">
import StatsCard from './StatsCard.vue';

interface StatItem {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  clickable?: boolean;
  action?: () => void;
}

interface Props {
  stats: StatItem[];
}

interface Emits {
  (e: 'stat-click', stat: StatItem): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleStatClick = (stat: StatItem): void => {
  if (stat.clickable && stat.action) {
    stat.action();
  }
  emit('stat-click', stat);
};
</script>

<style scoped>
/* グリッド固有のスタイルがあれば追加 */
</style>
