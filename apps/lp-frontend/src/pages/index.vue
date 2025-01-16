<template lang="pug">
div
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

const currentPage = ref(1);

useSeoMeta({
  title: 'TechPostCast',
  ogTitle: 'TechPostCast',
  description:
    'Qiitaの人気記事をAIが10分程度で解説するラジオ番組を配信しています',
  ogDescription:
    'Qiitaの人気記事をAIが10分程度で解説するラジオ番組を配信しています',
  ogImage: 'ogp_image.png',
  twitterCard: 'summary_large_image',
});

const { data, error } = await useAsyncData(
  `headline-topic-programs:${currentPage}`,
  async () => {
    try {
      const app = useNuxtApp();
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
</script>
