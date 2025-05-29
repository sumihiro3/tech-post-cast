<template lang="pug">
  v-container(class="max-width-container")
    //- v-navigation-drawer(
    //-   v-model="drawer"
    //-   app
    //-   permanent
    //-   color="white"
    //-   dark
    //- )
    //-   v-list(nav dense)
    //-     v-list-item(
    //-       v-for="(item, i) in menuItems"
    //-       :key="i"
    //-       :to="item.to"
    //-       :prepend-icon="item.icon"
    //-       :title="item.title"
    //-       color="primary"
    //-     )

    v-container(fluid)
      // ダッシュボードコンテンツ
      h1.text-h4.mb-6 ダッシュボード

      v-row
        v-col(cols="12" md="6" lg="3")
          v-card(elevation="2" class="mb-4")
            v-card-title
              v-icon(left color="primary" class="mr-2") mdi-television-play
              | 配信中の番組
            v-card-text.text-h4.text-center 12

        v-col(cols="12" md="6" lg="3")
          v-card(elevation="2" class="mb-4")
            v-card-title
              v-icon(left color="info" class="mr-2") mdi-account-group
              | 総視聴者数
            v-card-text.text-h4.text-center 1,254

        v-col(cols="12" md="6" lg="3")
          v-card(elevation="2" class="mb-4")
            v-card-title
              v-icon(left color="success" class="mr-2") mdi-chart-timeline-variant
              | 月間アクセス
            v-card-text.text-h4.text-center 45,678

        v-col(cols="12" md="6" lg="3")
          v-card(elevation="2" class="mb-4")
            v-card-title
              v-icon(left color="warning" class="mr-2") mdi-star
              | 平均評価
            v-card-text.text-h4.text-center 4.7

      v-row
        v-col(cols="12" md="8")
          v-card(elevation="2")
            v-card-title
              | 視聴者分析
              v-spacer
              v-select(
                v-model="selectedPeriod"
                :items="periods"
                label="期間"
                hide-details
                dense
                outlined
                class="period-selector"
              )
            v-card-text
              canvas(ref="viewerChart" height="250")

        v-col(cols="12" md="4")
          v-card(elevation="2")
            v-card-title 人気カテゴリ
            v-card-text
              canvas(ref="categoryChart" height="250")

      v-row(class="mt-4")
        v-col(cols="12")
          v-card(elevation="2")
            v-card-title
              | 最近の配信
              v-spacer
              v-btn(color="primary" variant="text" to="/broadcasts") すべて表示
            v-table
              thead
                tr
                  th タイトル
                  th カテゴリ
                  th 配信日時
                  th 視聴回数
                  th アクション
              tbody
                tr(v-for="(broadcast, index) in recentBroadcasts" :key="index")
                  td {{ broadcast.title }}
                  td {{ broadcast.category }}
                  td {{ broadcast.date }}
                  td {{ broadcast.views }}
                  td
                    v-btn(icon size="small" color="primary" :to="`/broadcasts/${broadcast.id}`")
                      v-icon mdi-eye
                    v-btn(icon size="small" color="info" :to="`/broadcasts/${broadcast.id}/edit`")
                      v-icon mdi-pencil
</template>

<script setup lang="ts">
import { useUIState } from '@/composables/useUIState';
import { onMounted, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// UI状態管理
const _ui = useUIState();

// import { useRouter } from 'vue-router';

// const router = useRouter();
// const drawer = ref(true);
const selectedPeriod = ref('week');

// const menuItems = [
//   { title: 'ダッシュボード', icon: 'mdi-view-dashboard', to: '/app/dashboard' },
//   { title: 'パーソナライズ番組の配信一覧', icon: 'mdi-television-play', to: '/app/broadcasts' },
//   { title: 'パーソナライズ番組設定', icon: 'mdi-cog', to: '/app/program-filter' },
//   { title: 'サブスクリプション一覧', icon: 'mdi-credit-card-outline', to: '/app/subscriptions' },
//   { title: 'ユーザー情報', icon: 'mdi-account', to: '/app/profile' },
// ];

const periods = ['日', '週', '月', '年'];

const recentBroadcasts = ref([
  {
    id: 1,
    title: '週間ニュースダイジェスト',
    category: 'ニュース',
    date: '2025-03-28',
    views: 1254,
  },
  {
    id: 2,
    title: 'テクノロジートレンド2025',
    category: 'テクノロジー',
    date: '2025-03-27',
    views: 986,
  },
  { id: 3, title: '健康レシピ特集', category: '料理', date: '2025-03-26', views: 765 },
  { id: 4, title: '週末おすすめスポット', category: '旅行', date: '2025-03-25', views: 543 },
]);

onMounted(() => {
  // Chart.jsなどを使用してグラフを描画する処理をここに書く
  // 実際の実装では、Chart.jsのインポートとグラフ描画コードが必要
  // 将来的にダッシュボードデータをAPIから取得する場合の例：
  // try {
  //   ui.showLoading({ message: 'ダッシュボードデータを読み込み中...' });
  //   // await fetchDashboardData();
  //   ui.showSuccess('ダッシュボードを更新しました');
  // } catch (error) {
  //   ui.showError('ダッシュボードデータの取得に失敗しました');
  // } finally {
  //   ui.hideLoading();
  // }
});
</script>

<style scoped>
.period-selector {
  max-width: 150px;
}

.v-card {
  border-radius: 12px;
}
</style>
