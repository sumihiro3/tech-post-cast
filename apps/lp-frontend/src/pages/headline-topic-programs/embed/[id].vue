<template lang="pug">
div(v-if='result && result.target')
  //- 表示対象のヘッドライントピック番組
  v-row(align='center').mb-0.pb-0
    v-col(cols='0', sm='2').mb-0.pb-0
    v-col(cols='12', sm='8').mb-0.pb-0
      ContentHeadlineTopicProgram(
        :key='result.target.id',
        :program='result.target',
        :showScript='true'
      )
    v-col(cols='0', sm='2').mb-0.pb-0
</template>

<script setup lang="ts">
import type { HeadlineTopicProgramWithSimilarAndNeighborsDto } from '@/api';
import { useGetHeadlineTopicProgramWithSimilarAndNeighbors } from '@/composables/headline-topic-programs/useGetHeadlineTopicProgramWithSimilarAndNeighbors';

definePageMeta({
  layout: 'embed',
});

const app = useNuxtApp();
const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: result } = await useAsyncData<HeadlineTopicProgramWithSimilarAndNeighborsDto>(
  `headline-topic-program:${programId}`,
  async () => {
    try {
      // 指定されたIDの番組情報と、前後の日付の番組情報を取得
      const dto = await useGetHeadlineTopicProgramWithSimilarAndNeighbors(app, programId);
      return { target: dto.target, similar: dto.similar, previous: dto.previous, next: dto.next };
    }
    catch (error) {
      console.error(`番組 [${programId}] の取得に失敗しました。`, error);
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

// SEO 向けのメタ情報を設定
const siteName = app.$config.public.siteName;
const siteDescription = app.$config.public.siteDescription;
const ogpImage = app.$config.public.siteOgpImageUrl;
const title = `${siteName} - ${result.value?.target.title}`;
useSeoMeta({
  title,
  ogTitle: title,
  description: siteDescription,
  ogDescription: siteDescription,
  ogImage: ogpImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogpImage,
});

// oEmbed 用のリンクを設定
const siteUrl = app.$config.public.lpUrl;
useHead({
  link: [{
    rel: 'alternate',
    type: 'application/json+oembed',
    href: `${siteUrl}/oembed/headline-topic-programs/${programId}.json`,
    title: `${title}`,
  }],
});
</script>
