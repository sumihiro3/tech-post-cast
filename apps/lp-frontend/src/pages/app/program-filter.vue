<template lang="pug">
v-container.max-width-container
  v-row(justify="center")
    v-col(cols="12")
      .text-center.text-h4.font-weight-bold.mb-6 パーソナライズ番組設定

  //- フィード設定部分
  v-card.mb-6(elevation="2")
    v-card-text
      .d-flex.align-center.justify-space-between.mb-4
        .text-h6.font-weight-medium 記事のフィルタリング設定

      //- フィルターオプション
      .my-4
      //- 番組名
      .mb-3
        .d-flex.align-center.mb-2
          v-icon(size="small" class="mr-1") mdi-radio
          span.font-weight-medium 番組名
        v-text-field(
          v-model="programTitle"
          density="comfortable"
          variant="outlined"
          placeholder="番組名を入力"
          hide-details
          class="mb-8"
        )

        //- 著者フィルター (コンボボックス)
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-account
            span.font-weight-medium 著者
          v-select(
            v-model="selectedAuthors"
            :items="allAuthors"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            label="著者を選択..."
            class="mb-4"
          )

        //- タグフィルター (コンボボックス)
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-tag
            span.font-weight-medium タグ
          v-select(
            v-model="selectedTags"
            :items="allTags"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            label="タグを選択..."
            class="mb-4"
          )

        //- 配信日フィルター
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-calendar
            span.font-weight-medium 配信日
          v-chip-group(
            v-model="selectedDateRange"
            mandatory
            selected-class="primary"
          )
            v-chip(
              v-for="range in dateRanges"
              :key="range"
              :value="range"
              filter
              variant="elevated"
              size="small"
            ) {{ range }}

        //- LGTM数フィルター
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-thumb-up
            span.font-weight-medium LGTM数
          v-slider(
            v-model="minLgtm"
            color="primary"
            :max="100"
            :min="0"
            :step="5"
            thumb-label
            hide-details
          )
            template(#append)
              v-text-field(
                v-model="minLgtm"
                density="compact"
                style="width: 70px"
                hide-details
                type="number"
                variant="outlined"
              )

  //- フィルターされた記事のプレビューリスト
  div
    .d-flex.align-center.mb-4
      .text-h6.font-weight-medium 番組対象の記事 ({{ filteredArticles.length }})

    div(v-if="filteredArticles.length === 0")
      v-card.text-center.pa-4
        .text-body-1.text-medium-emphasis 条件に一致する記事が見つかりませんでした。
        v-btn(
          variant="text"
          color="primary"
          class="mt-2"
          @click="clearFilters"
        ) フィルターをクリア

    qiita-post-list-item(
      v-for="article in filteredArticles"
      :key="article.id"
      :article="article"
    )
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// 状態管理
const programTitle = ref('');
const selectedAuthors = ref([]);
const selectedTags = ref([]);
const dateRanges = ['すべて', '今日', '今週', '今月', '今年'];
const selectedDateRange = ref('すべて');
const minLgtm = ref(0);

// Article
export interface Article {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  publishedAt: string;
  tags: string[];
  description: string;
  lgtmCount: number;
  commentCount: number;
  isStocked: boolean;
}

// サンプルのQiita記事データ
const qiitaArticles: Article[] = [
  {
    id: 1,
    title: 'Vue3とVuetifyで作るモダンUIコンポーネント',
    author: 'techvue',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-28',
    tags: ['Vue.js', 'Vuetify', 'フロントエンド'],
    description: 'Vue3とVuetify3を使った最新のUIコンポーネントの作成方法について解説します。実践的なサンプルコード付き。',
    lgtmCount: 85,
    commentCount: 12,
    isStocked: true,
  },
  {
    id: 2,
    title: 'Nuxt3での効率的なAPI連携パターン',
    author: 'nuxtmaster',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-27',
    tags: ['Nuxt.js', 'API', 'TypeScript'],
    description: 'Nuxt3でのAPI連携における効率的なパターンとベストプラクティスを紹介します。Composition APIを活用した実装例も。',
    lgtmCount: 62,
    commentCount: 8,
    isStocked: false,
  },
  {
    id: 3,
    title: 'TypeScriptで型安全なアプリケーション開発',
    author: 'tsdev',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-25',
    tags: ['TypeScript', 'JavaScript', '型安全'],
    description: 'TypeScriptを使って型安全なアプリケーションを開発するためのテクニックとパターンを解説します。',
    lgtmCount: 94,
    commentCount: 15,
    isStocked: true,
  },
  {
    id: 4,
    title: 'GitHub Actionsで実現するCI/CDパイプライン',
    author: 'gitmaster',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-20',
    tags: ['GitHub', 'CI/CD', '自動化'],
    description: 'GitHub Actionsを使った効率的なCI/CDパイプラインの構築方法について詳しく解説します。',
    lgtmCount: 73,
    commentCount: 9,
    isStocked: false,
  },
  {
    id: 5,
    title: 'Nuxt3とVuetifyで作るレスポンシブなダッシュボード',
    author: 'techvue',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-15',
    tags: ['Nuxt.js', 'Vuetify', 'ダッシュボード'],
    description: 'Nuxt3とVuetify3を使ったレスポンシブなダッシュボードの実装方法について解説します。',
    lgtmCount: 68,
    commentCount: 7,
    isStocked: true,
  },
  {
    id: 6,
    title: 'Nuxt3でのパフォーマンス最適化テクニック',
    author: 'nuxtmaster',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-10',
    tags: ['Nuxt.js', 'パフォーマンス', '最適化'],
    description: 'Nuxt3でのパフォーマンス最適化におけるテクニックとベストプラクティスを解説します。',
    lgtmCount: 54,
    commentCount: 6,
    isStocked: false,
  },
  // ダミーデータを20件まで増やす
  ...Array.from({ length: 20 }, (_, index) => ({
    id: index + 7,
    title: `ダミー記事 ${index + 7}`,
    author: 'dummyauthor',
    authorAvatar: 'https://qiita-image-store.s3.amazonaws.com/0/154381/profile-images/1481529593',
    publishedAt: '2025-03-01',
    tags: ['Nuxt.js', 'パフォーマンス', '最適化'],
    description: 'Nuxt3でのパフォーマンス最適化におけるテクニックとベストプラクティスを解説します。',
    lgtmCount: 54,
    commentCount: 6,
    isStocked: false,
  })),
];

// すべての著者を計算
const allAuthors = computed(() => {
  const authorSet = new Set();
  qiitaArticles.forEach((article) => {
    authorSet.add(article.author);
  });
  return Array.from(authorSet);
});

// すべてのタグを計算
const allTags = computed(() => {
  const tagSet = new Set();
  qiitaArticles.forEach((article) => {
    article.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
});

// 日付比較のヘルパー関数
const isWithinDateRange = (dateStr: string, range: string): boolean => {
  if (range === 'すべて') return true;

  const articleDate = new Date(dateStr);
  const today = new Date();

  // 今日の0時0分に設定
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (range === '今日') {
    return articleDate >= startOfToday;
  }

  if (range === '今週') {
    // 今週の月曜日に設定
    const dayOfWeek = today.getDay(); // 0=日曜日, 1=月曜日, ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return articleDate >= monday;
  }

  if (range === '今月') {
    // 今月の1日に設定
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return articleDate >= startOfMonth;
  }

  if (range === '今年') {
    // 今年の1月1日に設定
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    return articleDate >= startOfYear;
  }

  return false;
};

// フィルターを適用した記事リスト
const filteredArticles = computed(() => {
  return qiitaArticles.filter((article: Article) => {
    // 著者フィルター
    const matchesAuthor = selectedAuthors.value.length === 0
      || selectedAuthors.value.some(author => article.author.toLowerCase().includes(author.toLowerCase()));

    // タグフィルター
    const matchesTags = selectedTags.value.length === 0
      || selectedTags.value.some(tag => article.tags.includes(tag));

    // 配信日フィルター
    const matchesDateRange = isWithinDateRange(article.publishedAt, selectedDateRange.value);

    // LGTM数フィルター
    const matchesLgtm = article.lgtmCount >= minLgtm.value;

    return matchesAuthor && matchesTags && matchesDateRange && matchesLgtm;
  });
});

// フィルターをクリアする関数
const clearFilters = (): void => {
  programTitle.value = '';
  selectedAuthors.value = [];
  selectedTags.value = [];
  selectedDateRange.value = 'すべて';
  minLgtm.value = 0;
};
</script>

<style scoped>
.max-width-container {
  max-width: 900px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
