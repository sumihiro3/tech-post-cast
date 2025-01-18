<template lang="pug">
v-card.ma-1.pa-1.pa-md-2.mb-6.mb-md-10.bg-white(flat, rounded='lg')
  v-card-subtitle.text-caption.text-md-subtitle-1.font-weight-bold
    | {{ utcToJstDateString(program.createdAt) }} のヘッドライントピック
  v-card-text.text-h6.text-md-h5.font-weight-black
    a(:href='`/headline-topic-programs/${program.id}`')
      | {{ program.title }}
  v-card-text.mt-2.mt-md-4.mb-2.mb-md-4
    audio(controls, :src='program.audioUrl', preload='auto')
  v-tabs.mt-0(
    v-model='tab',
    background-color='transparent',
    align-tabs='center',
    fixed-tabs
  )
    v-tab.text-none.text-grey-darken-4(value='posts')
      | 紹介記事
    v-tab.text-none.text-grey-darken-4(v-if='showScript', value='script')
      | 番組の台本
  v-tabs-window(v-model='tab')
    //- 紹介記事一覧
    v-tabs-window-item(value='posts')
      v-list(lines='two')
        v-list-item(v-for='post in program.posts', :key='post.id')
          v-list-item-subtitle.text-caption.text-md-body-2.text-start.mb-2
            a.pb-2(
              :href='`https://qiita.com/${post.authorId}`',
              target='_blank'
            ) {{ post.authorName }}
            span.ml-4.ml-md-6
            | {{ utcToJstDateString(post.createdAt, 'YYYY年M月D日') }}
          v-list-item-title.text-body-1.text-md-subtitle-1.font-weight-bold.text-wrap.ml-4.ml-md-8
            a(:href='post.url', target='_blank')
              | {{ post.title }}
    //- 番組の台本
    v-tabs-window-item(v-if='showScript', value='script')
      p.mt-4.ml-2.ml-md-6.text-body-2.text-md-body-1
        | {{ program.script.intro }}
      p.mt-4.ml-2.ml-md-6.text-body-2.text-md-body-1(
        v-for='(post, index) in program.script.posts',
        :key='index'
      )
        | {{ post.summary }}
      p.mt-4.ml-2.ml-md-6.text-body-2.text-md-body-1
        | {{ program.script.ending }}
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
  list-style: disc;
  padding-left: 10px;
}
</style>
