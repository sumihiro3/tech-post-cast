<template lang="pug">
v-container(class="max-width-container")
  v-container(fluid class="pa-2 pa-sm-4 pa-md-6")
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
    div(v-else-if='errorMessage')
      v-row(align='center')
        v-col(cols='0', lg='1')
        v-col(cols='12', lg='10')
          v-alert(
            type="error"
            variant="tonal"
            class="ma-4"
          )
            | {{ errorMessage }}
        v-col(cols='0', lg='1')
</template>

<script setup lang="ts">
// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const route = useRoute();
const programId = route.params.id as string;

// 認証状態を確認
const { userId, isLoaded } = useAuth();

// プログラム詳細データを取得
const { data, error, pending } = await useAsyncData(`program-detail-${programId}`, async () => {
  if (!programId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'プログラムIDが指定されていません',
    });
  }

  // 認証の初期化を待つ
  while (!isLoaded.value) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // 認証されていない場合
  if (!userId.value) {
    throw createError({
      statusCode: 401,
      statusMessage: '認証が必要です',
    });
  }

  try {
    const { $dashboardApi } = useNuxtApp();
    const response = await $dashboardApi.getPersonalizedProgramDetail(programId);
    return response.data;
  } catch (err: unknown) {
    console.error('パーソナルプログラム詳細の取得に失敗しました:', err);

    if (err && typeof err === 'object' && 'response' in err) {
      const errorResponse = err as { response?: { status?: number } };
      if (errorResponse.response?.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'プログラムが見つかりません',
        });
      } else if (errorResponse.response?.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: '認証が必要です',
        });
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'プログラム詳細の取得に失敗しました',
    });
  }
});

const programDetail = computed(() => data.value);
const isLoading = computed(() => pending.value);
const errorMessage = computed(() => error.value?.statusMessage || null);

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
