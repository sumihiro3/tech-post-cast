<template lang="pug">
v-row.mb-6
  v-col(
    v-for="stat in stats"
    :key="stat.title"
    cols="12"
    sm="4"
    md="4"
    class="pa-1 pa-sm-2 pa-md-3"
  )
    // ローディング中はスケルトンローダーを表示
    v-skeleton-loader(
      v-if="loading"
      type="card"
      class="stats-skeleton"
    )
    // データがある場合は統計カードを表示
    StatsCard(
      v-else
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
  loading?: boolean;
}

interface Emits {
  (e: 'stat-click', stat: StatItem): void;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const handleStatClick = (stat: StatItem): void => {
  if (stat.clickable && stat.action) {
    stat.action();
  }
  emit('stat-click', stat);
};
</script>

<style scoped>
.stats-skeleton {
  border-radius: 12px;
  height: 140px;
}
</style>
