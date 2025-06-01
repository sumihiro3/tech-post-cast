<template lang="pug">
v-container(class="max-width-container")
  v-container(fluid class="pa-6 dashboard-content" :class="{ 'with-player': hasFooterContent }")
    // ページタイトル
    .d-flex.align-center.mb-6
      v-icon.mr-3(color="primary" size="large") mdi-view-dashboard
      h1.text-h4.font-weight-bold ダッシュボード

    // 統計カードセクション
    slot(name="stats")

    v-row
      // 左カラム
      v-col(cols="12" lg="8")
        slot(name="main-content")

      // 右カラム
      v-col(cols="12" lg="4")
        slot(name="sidebar")

    // 固定フッター（音声プレイヤーなど）
    slot(name="footer")
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const slots = useSlots();

// フッタースロットにコンテンツがあるかチェック
const hasFooterContent = computed(() => {
  return !!slots.footer;
});
</script>

<style scoped>
.dashboard-content {
  /* 基本的な下部マージン */
  margin-bottom: 20px;
  /* 最小高さを設定してコンテンツが短い場合でもスクロール可能にする */
  min-height: calc(100vh - 200px);
}

.dashboard-content.with-player {
  /* AudioPlayerが表示されている時のマージン（より大きく） */
  margin-bottom: 160px;
  /* AudioPlayerの高さを考慮した最小高さ */
  min-height: calc(100vh - 160px);
}
</style>
