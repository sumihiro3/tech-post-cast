<template lang="pug">
div
  div
    h1 ヘッドライントピック
    ul(v-if='programIds')
      li(v-for='programId in programIds')
        NuxtLink(:to='`/headline-topic-programs/${programId}`') Program {{ programId }}
        //- v-btn(:to='`/headline-topic-programs/${programId}`') Program {{ programId }}
  div(v-if='error') {{ error }}
  NuxtLink(to='about') Go to about page
</template>

<script setup lang="ts">
import useGetHeadlineTopicProgramIds from '@/composables/headline-topic-programs/useGetHeadlineTopicProgramIds';

// ヘッドライントピック番組の ID 一覧を取得する
const { data: programIds, error } = await useAsyncData(
  'headline-topic-programs',
  async () => {
    const programIds = await useGetHeadlineTopicProgramIds();
    return programIds;
  },
);
</script>
