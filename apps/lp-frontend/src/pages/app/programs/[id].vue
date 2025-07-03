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
import { useAuthGuard } from '~/composables/useAuthGuard';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const route = useRoute();
const programId = route.params.id as string;

// プログラム詳細データを取得
const { data, error, pending } = await useAsyncData(`program-detail-${programId}`, async () => {
  if (!programId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'プログラムIDが指定されていません',
    });
  }

  // 統一された認証チェックを使用
  const { ensureAuthenticated } = useAuthGuard();

  try {
    const authResult = await ensureAuthenticated({
      maxWaitTime: 5000, // ページレベルでは5秒タイムアウト
      pollInterval: 100,
      showLoading: true, // ページレベルではローディング表示
      showError: true, // エラーメッセージも表示
    });

    // 認証エラーの場合
    if (authResult.error) {
      console.error('認証エラー in program detail page:', authResult.error);

      if (authResult.error.code === 'INITIALIZATION_TIMEOUT') {
        throw createError({
          statusCode: 408,
          statusMessage: '認証の初期化がタイムアウトしました。ページを再読み込みしてください。',
        });
      } else if (authResult.error.code === 'INITIALIZATION_FAILED') {
        throw createError({
          statusCode: 500,
          statusMessage: '認証の初期化に失敗しました。しばらく待ってから再試行してください。',
        });
      } else if (authResult.error.code === 'AUTHENTICATION_REQUIRED') {
        throw createError({
          statusCode: 401,
          statusMessage: '認証が必要です',
        });
      }
    }

    // 認証されていない場合
    if (!authResult.isAuthenticated) {
      throw createError({
        statusCode: 401,
        statusMessage: '認証が必要です',
      });
    }

    console.log('Program detail page - authentication successful:', {
      userId: authResult.userId,
      programId,
    });
  } catch (authError) {
    console.error('認証チェックで予期しないエラー:', authError);
    throw createError({
      statusCode: 500,
      statusMessage: '認証チェックに失敗しました',
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
      } else if (errorResponse.response?.status === 403) {
        throw createError({
          statusCode: 403,
          statusMessage: 'このプログラムにアクセスする権限がありません',
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
