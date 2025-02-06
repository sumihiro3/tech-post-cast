<template lang="pug">
div(v-if='result && result.target')
  //- 表示対象のヘッドライントピック番組
  v-row(align='center')
    v-col(cols='0', sm='2').mb-0.pb-0
    v-col(cols='12', sm='8').mb-0.pb-0
      ContentHeadlineTopicProgram(
        :key='result.target.id',
        :program='result.target',
        :showScript='true'
        :initialTab="initialTab"
      )
    v-col(cols='0', sm='2').mb-0.pb-0
  //- 類似番組
  div(v-if="result.similar").pa-0.ma-0
    v-row(align='center')
      v-col(cols='0', sm='2').mb-0.pb-0
      v-col(cols='12', sm='8').mb-0.pb-0
        div.text-center.text-md-left.text-subtitle-1.font-weight-bold
          | よく似た番組
      v-col(cols='0', sm='2').ma-0.pa-0
    v-row(align='center').px-0.mx-0
      v-col(cols='0', sm='2').ma-0.pa-0
      v-col(cols='12', sm='8').ma-0.pa-0
        ContentHeadlineTopicProgramSmall(v-for="program in result.similar", :key='program.id', :program='program')
      v-col(cols='0', sm='2').ma-0.pa-0
  //- 前後の番組
  div().pa-0.ma-0
    v-row(align='center')
      v-col(cols='0', sm='2').mb-0.pb-0
      v-col(cols='12', sm='8').mb-0.pb-0
        div.text-center.text-md-left.text-subtitle-1.font-weight-bold
          | 前後の番組
      v-col(cols='0', sm='2').ma-0.pa-0
    v-row(align='center')
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
import type { HeadlineTopicProgramWithSimilarAndNeighborsDto } from '@/api';
import { useGetHeadlineTopicProgramWithSimilarAndNeighbors } from '@/composables/headline-topic-programs/useGetHeadlineTopicProgramWithSimilarAndNeighbors';

const app = useNuxtApp();
const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

// クエリパラメーターからヘッドライントピック番組の初期表示タブを取得する
const initialTab = route.query.tab ? String(route.query.tab) : 'posts';

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
</script>
