<template lang="pug">
div
  HeroHeader
  div(v-if='programs')
    v-container
      v-row.pa-4(align='center')
        v-col(cols='10')
          ContentHeadlineTopicProgram(
            v-for='program in programs',
            :key='program.id',
            :program='program'
          )
  div
  v-pagination(
    v-model='currentPage',
    :length='pages',
    active-color='secondary',
    @click='onPageChange'
  )
</template>

<script setup lang="ts">
import { useGetCurrentPagePrograms } from '@/composables/headline-topic-programs/useGetCurrentPagePrograms';

const currentPage = ref(1);

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

/**
 * ページネーションでページが変更されたときの処理
 * @param event イベント
 */
const onPageChange = async (event: PointerEvent) => {
  console.log('Event', event);
  await navigateTo(`/headline-topic-programs/pages/${currentPage.value}`);
};

const programs = data.value?.programs;
const pages = data.value?.pages;
</script>
