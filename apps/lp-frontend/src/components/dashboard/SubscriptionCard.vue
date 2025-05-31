<template lang="pug">
SectionCard(
  :title="title"
  :icon="icon"
  :class="containerClass"
)
  template(#actions)
    slot(name="actions")

  v-card-text
    .text-center.mb-4
      v-chip(
        :color="subscription.planColor"
        size="large"
        class="font-weight-bold"
      ) {{ subscription.planName }}

    // プラン制限の使用状況
    template(v-for="usage in usageItems" :key="usage.label")
      UsageProgress(
        :label="usage.label"
        :current="usage.current"
        :limit="usage.limit"
        :show-percentage="usage.showPercentage"
        :warning-threshold="usage.warningThreshold"
        :danger-threshold="usage.dangerThreshold"
      )

    // 利用可能な機能
    v-list.mb-4(v-if="subscription.features && subscription.features.length > 0" density="compact")
      v-list-subheader {{ featuresTitle }}
      v-list-item(
        v-for="feature in subscription.features"
        :key="feature.name"
        class="px-0"
      )
        template(#prepend)
          v-icon(
            :color="feature.available ? 'success' : 'grey'"
            size="small"
          ) {{ feature.available ? 'mdi-check-circle' : 'mdi-close-circle' }}
        v-list-item-title(
          :class="{ 'text-grey': !feature.available }"
          class="text-body-2"
        ) {{ feature.name }}

    // アップグレードボタン
    v-btn(
      v-if="showUpgradeButton"
      color="primary"
      block
      size="large"
      @click="handleUpgrade"
    ) {{ upgradeButtonText }}

    // カスタムアクション
    slot(name="custom-actions")
</template>

<script setup lang="ts">
import SectionCard from './SectionCard.vue';
import UsageProgress from './UsageProgress.vue';

interface Feature {
  name: string;
  available: boolean;
}

interface UsageItem {
  label: string;
  current: number;
  limit: number;
  showPercentage?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
}

interface Subscription {
  planName: string;
  planColor: string;
  features?: Feature[];
}

interface Props {
  title?: string;
  icon?: string;
  subscription: Subscription;
  usageItems: UsageItem[];
  containerClass?: string;
  featuresTitle?: string;
  showUpgradeButton?: boolean;
  upgradeButtonText?: string;
}

interface Emits {
  (e: 'upgrade'): void;
}

withDefaults(defineProps<Props>(), {
  title: 'サブスクリプション',
  icon: 'mdi-crown',
  containerClass: '',
  featuresTitle: '利用可能な機能',
  showUpgradeButton: true,
  upgradeButtonText: 'プランをアップグレード',
});

const emit = defineEmits<Emits>();

const handleUpgrade = (): void => {
  emit('upgrade');
};
</script>

<style scoped>
/* サブスクリプションカード固有のスタイルがあれば追加 */
</style>
