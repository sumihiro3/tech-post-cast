<template lang="pug">
v-card.ma-1.pa-1.pa-md-2.mb-6.mb-md-10.bg-blue-grey-lighten-4(
  flat,
  rounded='lg'
)
  v-card-subtitle.text-caption.text-md-subtitle-1.font-weight-bold
    | {{ utcToJstDateString(program.createdAt) }} のヘッドライントピック
  v-card-text.text-h6.text-md-h5.font-weight-black
    a(:href='`/headline-topic-programs/${program.id}`')
      | {{ program.title }}
  v-card-text.mt-2.mt-md-4.mb-2.mb-md-4
    audio(controls, :src='program.audioUrl')
  v-tabs.mt-0(
    v-model='tab',
    background-color='transparent',
    align-tabs='center',
    fixed-tabs
  )
    v-tab.text-none.text-grey-darken-1(value='posts')
      | 紹介記事
    v-tab.text-none.text-grey-darken-1(v-if='showScript', value='script')
      | 台本
  v-tabs-window(v-model='tab')
    v-tabs-window-item(value='posts')
      ul.mt-4.ml-2.post-list
        li.mb-1.text-body-2.text-md-body-1(
          v-for='post in program.posts',
          :key='post.id'
        )
          a(:href='post.url', target='_blank')
            | {{ post.title }}
</template>

<script lang="ts" setup>
import type { HeadlineTopicProgramDto } from '@/api';
const { utcToJstDateString } = useDateUtil();

const tab = ref('posts');

const props = defineProps<{
  program: HeadlineTopicProgramDto;
  showScript?: boolean;
}>();
</script>

<style lang="css" scoped>
audio {
  width: 100%;
}
.post-list {
  list-style: disc !important;
}
</style>
