<template lang="pug">
div
  div
    h1 ヘッドライントピック
    ul(v-if='programs')
      li(v-for='program in programs')
        NuxtLink(:to='`/headline-topic-programs/${program.id}`') Program {{ program.title }}
  NuxtLink(to='about') Go to about page
  ul(v-if='pages')
    li(v-for='i in pages')
      NuxtLink(
        v-if='i !== currentPage',
        :to='`/headline-topic-programs/pages/${i}`'
      ) P.{{ i }}
      span(v-else) P.{{ i }}
</template>

<script setup lang="ts">
import { useGetCurrentPagePrograms } from '@/composables/headline-topic-programs/useGetCurrentPagePrograms';

const currentPage = 1;

const { data, error } = await useAsyncData(
  `headline-topic-programs:${currentPage}`,
  async () => {
    try {
      const app = useNuxtApp();
      const result = await useGetCurrentPagePrograms(app, currentPage);
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
