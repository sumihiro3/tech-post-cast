<template lang="pug">
v-container(class="max-width-container")
  v-container(fluid class="pa-6")
    // 戻るリンク
    .d-flex.align-center.mb-6
      v-btn(
        variant="text"
        color="primary"
        class="mr-4"
        @click="goBackToList"
      )
        v-icon.mr-2 mdi-arrow-left
        | 一覧に戻る

    div(v-if='programDetail')
      //- 表示対象のパーソナルプログラム（幅広表示）
      v-row(align='center')
        v-col(cols='0', lg='1')
        v-col(cols='12', lg='10')
          ContentPersonalizedProgram(
            :key='programDetail.id',
            :program='programDetail',
            :showScript='true'
          )
        v-col(cols='0', lg='1')
    div(v-else-if='isLoading')
      v-row(align='center')
        v-col(cols='0', lg='1')
        v-col(cols='12', lg='10')
          .d-flex.justify-center.align-center(style="min-height: 400px;")
            v-progress-circular(
              indeterminate
              color="primary"
              size="64"
            )
        v-col(cols='0', lg='1')
    div(v-else-if='error')
      v-row(align='center')
        v-col(cols='0', lg='1')
        v-col(cols='12', lg='10')
          v-alert(
            type="error"
            variant="tonal"
            class="ma-4"
          )
            | {{ error }}
        v-col(cols='0', lg='1')
</template>

<script setup lang="ts">
import { useDashboardProgramDetail } from '@/composables/dashboard/useDashboardProgramDetail';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const route = useRoute();
const programId = route.params.id as string;

// コンポーザブルの使用
const { programDetail, isLoading, error, fetchProgramDetail } = useDashboardProgramDetail();

// ページ読み込み時にデータを取得
onMounted(async () => {
  if (programId) {
    await fetchProgramDetail(programId);
  }
});

// 一覧に戻る処理
const goBackToList = (): void => {
  navigateTo('/app/programs');
};

// SEO設定
const title = computed(() => {
  if (programDetail.value) {
    return `${programDetail.value.title} - Tech Post Cast`;
  }
  return 'プログラム詳細 - Tech Post Cast';
});

useSeoMeta({
  title,
  description: 'パーソナルプログラムの詳細情報を確認できます。',
});
</script>

<style scoped>
.max-width-container {
  max-width: 1200px;
  margin: 0 auto;
}

.program-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.script-content {
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.border-b:last-child {
  border-bottom: none;
}
</style>
