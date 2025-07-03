<template lang="pug">
v-container(class="max-width-container")
  v-container(fluid class="pa-2 pa-sm-4 pa-md-6")
    // ページタイトル
    .d-flex.align-center.mb-6
      v-icon.mr-3(color="primary" :size="$vuetify.display.mobile ? 'default' : 'large'") mdi-podcast
      h1.text-h5.text-sm-h4.font-weight-bold パーソナルプログラム一覧

    // ページネーション（上部）
    Pagination.mb-4(
      :currentPage='currentPage',
      :pages='pages || 0',
      linkPrefix='/app/programs/pages',
      mode='ssr'
    )

    // プログラム一覧（幅広表示）
    v-row(v-if='programs', align='center')
      v-col(cols='0', lg='1')
      v-col(cols='12', lg='10')
        ContentPersonalizedProgramList(
          v-for='program in programs',
          :key='program.id',
          :program='program'
        )
      v-col(cols='0', lg='1')

    // ページネーション（下部）
    Pagination(
      :currentPage='currentPage',
      :pages='pages || 0',
      linkPrefix='/app/programs/pages',
      mode='ssr'
    )
</template>

<script setup lang="ts">
import { useGetCurrentPagePersonalizedPrograms } from '@/composables/personalized-programs/useGetCurrentPagePersonalizedPrograms';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const app = useNuxtApp();
const route = useRoute();
const currentPage = ref(route.params.page ? Number(route.params.page) : 1);

const { data } = await useAsyncData(`personalized-programs:${currentPage.value}`, async () => {
  try {
    const result = await useGetCurrentPagePersonalizedPrograms(app, currentPage.value);
    return { programs: result.programs, pages: result.pages };
  } catch (error) {
    console.error(
      `${currentPage.value}ページ目のパーソナルプログラム一覧の取得に失敗しました。`,
      error,
    );
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw showError({
      message: `指定のページが存在しません`,
      statusCode: 404,
      fatal: true,
    });
  }
});

const programs = data.value?.programs;
const pages = data.value?.pages;

// SEO 向けのメタ情報を設定
const siteName = app.$config.public.siteName;
const siteDescription = app.$config.public.siteDescription;
const ogpImage = app.$config.public.siteOgpImageUrl;
const title = `パーソナルプログラム一覧 - ${siteName}`;
useSeoMeta({
  title,
  ogTitle: title,
  description: siteDescription,
  ogDescription: siteDescription,
  ogImage: ogpImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogpImage,
});
</script>

<style scoped>
.max-width-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
