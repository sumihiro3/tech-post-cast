<template lang="pug">
div(v-if='program')
  v-row(align='center')
    v-col(cols='0', sm='2')
    v-col(cols='12', sm='8')
      ContentHeadlineTopicProgram(
        :key='program.id',
        :program='program',
        :showScript='true'
      )
    v-col(cols='0', sm='2')
</template>

<script setup lang="ts">
import type { HeadlineTopicProgramDto } from '@/api';
import { useGetHeadlineTopicProgram } from '@/composables/headline-topic-programs/useGetHeadlineTopicProgram';

const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: program } = await useAsyncData<HeadlineTopicProgramDto>(
  `headline-topic-program:${programId}`,
  async () => {
    try {
      const app = useNuxtApp();
      // 指定されたIDの番組情報を取得
      const dto = await useGetHeadlineTopicProgram(app, programId);
      return { ...dto };
    } catch (error) {
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

useSeoMeta({
  title: `TechPostCast - ${program.value?.title}`,
  ogTitle: `TechPostCast - ${program.value?.title}`,
  description:
    'Qiitaの人気記事をAIが10分程度で解説するラジオ番組を配信しています',
  ogDescription:
    'Qiitaの人気記事をAIが10分程度で解説するラジオ番組を配信しています',
  ogImage: 'https://pub-2bec3306c9a1436e8bc204465623e633.r2.dev/ogp_image.png',
  twitterCard: 'summary_large_image',
});
</script>
