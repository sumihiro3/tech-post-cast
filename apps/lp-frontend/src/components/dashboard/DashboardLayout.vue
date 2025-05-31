<template lang="pug">
v-container(class="max-width-container")
  v-container(fluid class="pa-6")
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
// このコンポーネントはレイアウトのみを担当するため、
// 特別なロジックは不要
</script>

<style scoped>
/* レイアウト固有のスタイルがあれば追加 */
</style>
