<template lang="pug">
div.pa-0.ma-0
  HeroHeader
  v-row(v-if='programs', align='center')
    v-col(cols='0', sm='2', lg='3')
    v-col(cols='12', sm='8', lg='6')
      ContentHeadlineTopicProgram(
        v-for='program in programs',
        :key='program.id',
        :program='program'
      )
    v-col(cols='0', sm='2', lg='3')
  Pagination(
    :currentPage='currentPage',
    :pages='pages || 0',
    linkPrefix='/headline-topic-programs/pages'
  )
</template>

<script setup lang="ts">
import { useGetCurrentPagePrograms } from '@/composables/headline-topic-programs/useGetCurrentPagePrograms';

const app = useNuxtApp();
const currentPage = ref(1);

const { data, error } = await useAsyncData(
  `headline-topic-programs:${currentPage}`,
  async () => {
    try {
      const result = await useGetCurrentPagePrograms(app, currentPage.value);
      return { programs: result.programs, pages: result.pages };
    } catch (error) {
      console.error(
        `${currentPage}ページ目の番組一覧の取得に失敗しました。`,
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
  },
);

const programs = data.value?.programs;
const pages = data.value?.pages;

// SEO 向けのメタ情報を設定
const siteName = app.$config.public.siteName;
const siteSummary = app.$config.public.siteSummary;
const siteDescription = app.$config.public.siteDescription;
const ogpImage = app.$config.public.siteOgpImageUrl;
const title = `${siteName} - ${siteSummary}`;
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
