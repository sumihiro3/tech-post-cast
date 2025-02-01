<template lang="pug">
div(v-if='result && result.target')
  v-row(align='center')
    v-col(cols='0', sm='2').mb-0.pb-0
    v-col(cols='12', sm='8').mb-0.pb-0
      ContentHeadlineTopicProgram(
        :key='result.target.id',
        :program='result.target',
        :showScript='true'
      )
    v-col(cols='0', sm='2').mb-0.pb-0
  v-row(align='center')
    v-col(cols='0', sm='2').mb-0.pb-0
    v-col(cols='12', sm='8').mb-0.pb-0
      div.text-center.text-md-left.text-subtitle-1.font-weight-bold
        | 前後の番組
    v-col(cols='0', sm='2').mb-0.pb-0
  v-row(align='center').px-0.mx-0
    v-col(cols='0', sm='2').mb-0.pb-0
    v-col(cols='12', sm='4').mb-0.pb-0
      v-row.d-flex.align-center.justify-center.fill-height
        v-col(cols='1').mb-0.pb-0
          v-icon(v-if="result.next" color='primary', size='64' icon="mdi-chevron-left").pr-12.pb-4
        v-col(cols='11').mb-0.pb-0
          ContentHeadlineTopicProgramSmall(v-if="result.next" :key='result.next?.id', :program='result.next')
    v-col(cols='12', sm='4').mb-0.pb-0
      v-row.d-flex.align-center.justify-center.fill-height
        v-col(cols='11').mb-0.pb-0
          ContentHeadlineTopicProgramSmall(v-if="result.previous" :key='result.previous?.id', :program='result.previous')
        v-col(cols='1').mb-0.pb-0
          v-icon(v-if="result.previous" color='primary', size='64' icon="mdi-chevron-right").pr-12.pb-4
    v-col(cols='0', sm='2').mb-0.pb-0
</template>

<script setup lang="ts">
import type { HeadlineTopicProgramWithNeighborsDto } from '@/api';
import { useGetHeadlineTopicProgramWithNeighbors } from '@/composables/headline-topic-programs/useGetHeadlineTopicProgramWithNeighbors';

const app = useNuxtApp();
const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: result } = await useAsyncData<HeadlineTopicProgramWithNeighborsDto>(
  `headline-topic-program:${programId}`,
  async () => {
    try {
      // 指定されたIDの番組情報と、前後の日付の番組情報を取得
      const dto = await useGetHeadlineTopicProgramWithNeighbors(app, programId);
      return { target: dto.target, previous: dto.previous, next: dto.next };
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
</script>
