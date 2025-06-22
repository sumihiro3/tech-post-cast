<template lang="pug">
v-card.subscription-card(elevation="2")
  v-card-title.d-flex.align-center.justify-space-between
    .d-flex.align-center
      v-icon.mr-2(color="primary" :size="$vuetify.display.mobile ? 'default' : 'large'") mdi-crown
      span.text-subtitle-1.text-sm-h6 サブスクリプション情報
    v-chip(
      v-if="subscription"
      :color="planColorClass"
      variant="flat"
      size="small"
    ) {{ planDisplayName }}

  v-card-text.pa-2.pa-sm-3.pa-md-4
    // ローディング状態
    v-skeleton-loader(
      v-if="loading"
      type="list-item-two-line, divider, list-item-two-line, divider, list-item-two-line"
    )

    // エラー状態
    v-alert(
      v-else-if="error"
      type="error"
      variant="tonal"
      :text="error.message"
    )

    // サブスクリプション情報表示
    div(v-else-if="subscription")
      // 機能一覧
      .mb-4
        h4.text-subtitle-1.mb-2 利用可能な機能
        v-list.bg-transparent(density="compact")
          v-list-item(
            v-for="feature in subscription.features"
            :key="feature.name"
            :prepend-icon="feature.available ? 'mdi-check-circle' : 'mdi-close-circle'"
            :class="{ 'text-disabled': !feature.available }"
          )
            v-list-item-title {{ feature.name }}
            template(#prepend)
              v-icon(
                :color="feature.available ? 'success' : 'error'"
                :icon="feature.available ? 'mdi-check-circle' : 'mdi-close-circle'"
              )

      v-divider.my-4

      // 使用量情報
      .mb-4
        h4.text-subtitle-1.mb-2 使用量

        // 警告表示（フィード数の直上に配置）
        v-alert(
          v-if="usageWarnings.length > 0"
          :type="hasHighUsage ? 'error' : 'warning'"
          variant="tonal"
          class="mb-3"
        )
          template(#title)
            span {{ hasHighUsage ? '使用量上限に近づいています' : '使用量が多くなっています' }}
          ul.mt-2
            li(v-for="warning in usageWarnings" :key="warning.label")
              | {{ warning.label }}: {{ Math.round(warning.percentage) }}%

        // アップグレードボタン（警告表示の直下）
        v-btn(
          v-if="subscription.showUpgradeButton && usageWarnings.length > 0"
          color="primary"
          variant="elevated"
          block
          class="mb-3"
          @click="handleUpgrade"
        )
          v-icon.mr-2 mdi-arrow-up-bold
          | プランをアップグレード

        .usage-items
          .usage-item(
            v-for="item in subscription.usageItems"
            :key="item.label"
            class="mb-3"
          )
            .d-flex.justify-space-between.align-center.mb-1
              span.text-body-2 {{ item.label }}
              span.text-caption {{ item.current }} / {{ item.limit }}
            v-progress-linear(
              :model-value="(item.current / item.limit) * 100"
              :color="getUsageColor(item)"
              height="8"
              rounded
            )

      // アップグレードボタン（警告がない場合）
      v-btn(
        v-if="subscription.showUpgradeButton && usageWarnings.length === 0"
        color="primary"
        variant="elevated"
        block
        @click="handleUpgrade"
      )
        v-icon.mr-2 mdi-arrow-up-bold
        | プランをアップグレード

    // データなし状態
    v-alert(
      v-else
      type="info"
      variant="tonal"
      text="サブスクリプション情報を読み込み中..."
    )
</template>

<script setup lang="ts">
import type { UsageItemDto } from '@/api';
import { useDashboardSubscription } from '@/composables/dashboard/useDashboardSubscription';

// コンポーザブル
const { subscription, loading, error, planDisplayName, planColorClass, usageWarnings } =
  useDashboardSubscription();

// 使用量の色を決定
const getUsageColor = (item: UsageItemDto): string => {
  const percentage = (item.current / item.limit) * 100;
  if (percentage >= item.dangerThreshold) {
    return 'error';
  } else if (percentage >= item.warningThreshold) {
    return 'warning';
  }
  return 'success';
};

// 高使用量の警告があるかチェック
const hasHighUsage = computed(() => {
  return usageWarnings.value.some((warning) => warning.level === 'danger');
});

// アップグレード処理
const handleUpgrade = (): void => {
  // TODO: アップグレードページへの遷移を実装
  console.log('アップグレード処理');
  navigateTo('/app/subscription/upgrade');
};
</script>

<style scoped>
.subscription-card {
  /* height: 100%を削除してコンテンツに応じた高さにする */
}

.usage-item {
  padding: 8px 0;
}
</style>
