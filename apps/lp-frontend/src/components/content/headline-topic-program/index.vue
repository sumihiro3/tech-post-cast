<template lang="pug">
v-card.ma-1.pa-1.pa-md-2.mb-6.mb-md-10.bg-white(flat, rounded='lg')
  v-card-subtitle.text-caption.text-md-subtitle-1.font-weight-bold
    | {{ utcToJstDateString(program.createdAt) }} のヘッドライントピック
  v-card-text.text-h6.text-md-h5.font-weight-black
    a(:href='`/headline-topic-programs/${program.id}`')
      | {{ program.title }}
  v-card-text.mt-2.mt-md-4.mb-2.mb-md-4
    audio(
      ref='player',
      controls,
      preload='auto',
      @timeupdate='updateCurrentChapter',
      @play='isPlaying = true',
      @pause='isPlaying = false',
      @ended='isPlaying = false'
    )
      source(:src='program.audioUrl', type='audio/mpeg')
  v-tabs.mt-0(
    v-model='tab',
    align-tabs='center',
    bg-color='transparent',
    color='primary',
    grow
  )
    v-tab.text-b(value='posts')
      | 紹介記事
    v-tab(v-if='hasChapters(program)', value='chapters')
      | チャプター
    v-tab(v-if='showScript', value='script')
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
    //- チャプター一覧
    v-tabs-window-item(v-if='hasChapters(program)', value='chapters')
      ol.chapter-list
        li.ml-4.ml-md-6.mt-2(
          v-for='(chapter, index) in program.chapters',
          :key='index',
          :class='{ "active-chapter": currentChapterIndex === index }'
        )
          a.text-left.text-grey-darken-4(
            @click='seekTo(chapter.startTime / 1000)'
          ) 
            | {{ chapter.title }}
            //- 現在再生中のチャプターを示すアイコン
            v-icon.ml-1.mb-1(
              v-if='isPlaying && index === currentChapterIndex',
              color='primary'
            ) mdi-volume-high
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

// Audio Player
const player = ref<HTMLAudioElement | null>(null);
// 再生状態
const isPlaying = ref(false);
// 現在のチャプターインデックス
const currentChapterIndex = ref(-1);

/**
 * 番組にチャプター情報が含まれているかを判定する
 * @param program ヘッドライントピック番組
 * @returns チャプター情報が含まれているか
 */
const hasChapters = (program: HeadlineTopicProgramDto) => {
  return program.chapters && program.chapters.length > 0;
};

/**
 * 音声ファイルを指定時間へ移動して再生する
 * @param time 開始時間
 */
const seekTo = (time: number) => {
  console.debug('seekTo', { time });
  if (player.value) {
    player.value.currentTime = time;
    player.value.play();
  }
};

/**
 * 再生時間を監視して現在のチャプターを更新する
 */
const updateCurrentChapter = () => {
  console.debug('updateCurrentChapter', {
    currentTime: player.value?.currentTime,
    ended: player.value?.ended,
  });
  if (!player.value || player.value.ended) {
    // 再生終了時はチャプターをリセット
    currentChapterIndex.value = -1;
    return;
  }
  const currentTime = player.value!.currentTime;
  const index = props.program.chapters.findIndex((chapter, i) => {
    const startTime = chapter.startTime / 1000;
    const endTime = chapter.endTime / 1000;
    return currentTime >= startTime && currentTime < endTime;
  });
  currentChapterIndex.value = index;
  console.debug('currentChapterIndex', { currentChapterIndex: index });
};

const props = defineProps<{
  program: HeadlineTopicProgramDto;
  showScript?: boolean;
}>();
</script>

<style lang="css" scoped>
audio {
  width: 100%;
}
ol.chapter-list {
  list-style-position: outside;
  padding-left: 10px;
}
li.active-chapter {
  background-color: #edeeee;
  font-weight: bold;
}
</style>
