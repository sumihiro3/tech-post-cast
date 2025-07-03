<template lang="pug">
v-card.ma-1.pa-1.pa-sm-2.pa-md-3.pa-lg-4.mb-6.mb-md-10.bg-white(flat, rounded='lg')
  v-card-subtitle.text-caption.text-md-subtitle-1.font-weight-bold
    | {{ utcToJstDateString(program.createdAt) }} のパーソナルプログラム
  v-card-text.text-h6.text-md-h5.font-weight-black
    a(:href='`/app/programs/${program.id}`')
      | {{ program.title }}
  v-card-subtitle.text-caption.text-md-body-2.mt-2
    v-icon.mr-2(size='16', color='secondary') mdi-rss
    span パーソナルフィード：
    a.text-decoration-none.font-weight-medium(
      @click="goToFeedEdit"
    ) {{ program.feedName }}

  // 追加情報（音声時間・有効期限）
  v-card-text.pt-0.pb-3(v-if='program.audioDuration || (program.expiresAt && program.expiresAt.trim())')
    // 音声時間
    .d-flex.align-center.text-caption.text-md-body-2.mb-2(v-if='program.audioDuration')
      v-icon.mr-2(size='16') mdi-clock
      span 番組時間：{{ formatDuration(program.audioDuration) }}

    // 有効期限
    .d-flex.align-center.text-caption.text-md-body-2(v-if='program.expiresAt && program.expiresAt.trim()')
      v-icon.mr-2(size='16', :color='program.isExpired ? "error" : "success"') mdi-calendar-clock
      span(
        :class='program.isExpired ? "text-error" : "text-success"'
      ) {{ program.isExpired ? '期限切れ' : `${formatExpiryDate(program.expiresAt)}まで有効` }}

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
              :href='getAuthorUrl(post)',
              target='_blank'
            ) {{ post.authorName }}
            span.ml-4.ml-md-6
            | {{ formatPostDate(post.createdAt) }}
          v-list-item-title.text-body-1.text-md-subtitle-1.font-weight-bold.text-wrap.ml-4.ml-md-8
            a(:href='post.url', target='_blank')
              | {{ post.title }}
          v-list-item-subtitle.text-caption.text-md-body-2.ml-4.ml-md-8.mt-1(v-if='post.summary')
            | {{ post.summary }}
          v-list-item-subtitle.text-caption.text-md-body-2.ml-4.ml-md-8.mt-1
            v-icon.mr-1(size='16') mdi-heart
            | {{ post.likesCount }}
            v-icon.ml-4.mr-1(size='16') mdi-bookmark
            | {{ post.stocksCount }}
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
      //- オープニング
      p.mt-4.ml-2.ml-md-6.text-body-2.text-md-body-1.script-content(
        v-if='scriptData.opening'
        :class='{ "active-chapter-script": currentChapterIndex === 1 }'
      )
        | {{ formatScriptForDisplay(scriptData.opening) }}

      //- 記事の要約
      div.mt-4.ml-2.ml-md-6.text-body-2.text-md-body-1(
        v-for='(post, index) in scriptData.posts',
        :key='index'
      )
        //- intro
        p.mb-2.script-content(
          v-if='post.intro'
          :class='{ "active-chapter-script": currentChapterIndex === index + 2 }'
        )
          | {{ formatScriptForDisplay(post.intro) }}

        //- explanation
        p.mb-2.script-content(
          v-if='post.explanation'
          :class='{ "active-chapter-script": currentChapterIndex === index + 2 }'
        )
          | {{ formatScriptForDisplay(post.explanation) }}

        //- summary
        p.mb-2.script-content(
          v-if='post.summary'
          :class='{ "active-chapter-script": currentChapterIndex === index + 2 }'
        )
          | {{ formatScriptForDisplay(post.summary) }}

      //- エンディング
      p.mt-4.ml-2.ml-md-6.text-body-2.text-md-body-1.script-content(
        v-if='scriptData.ending'
        :class='{ "active-chapter-script": currentChapterIndex === scriptData.posts.length + 2 }'
      )
        | {{ formatScriptForDisplay(scriptData.ending) }}
</template>

<script lang="ts" setup>
import type { GetDashboardPersonalizedProgramDetailResponseDto } from '@/api';

interface Properties {
  /** パーソナルプログラム */
  program: GetDashboardPersonalizedProgramDetailResponseDto;
  /** 番組の台本を表示するか */
  showScript?: boolean;
  /** ページ初期表示のタブ */
  initialTab?: string;
}

/** コンポーネントのプロパティ */
const props = withDefaults(defineProps<Properties>(), {
  showScript: false,
  initialTab: 'posts',
});

const { utcToJstDateString } = useDateUtil();

const tab = ref(props.initialTab);

// Audio Player
const player = ref<HTMLAudioElement | null>(null);
// 再生状態
const isPlaying = ref(false);
// 現在のチャプターインデックス
const currentChapterIndex = ref(-1);

/**
 * 音声時間をフォーマット
 */
const formatDuration = (duration: number): string => {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * 有効期限をフォーマット
 */
const formatExpiryDate = (expiresAt: string | null): string => {
  if (!expiresAt) return '';
  return utcToJstDateString(expiresAt, 'M月D日');
};

/**
 * 番組台本データを取得するcomputed property
 */
const scriptData = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const script = props.program.script as any;

  // デバッグ用ログ
  console.log('Script data structure:', {
    script,
    keys: script ? Object.keys(script) : [],
    opening: script?.opening,
    posts: script?.posts,
    ending: script?.ending,
  });

  return {
    opening: script?.opening || null,
    posts: script?.posts || [],
    ending: script?.ending || null,
  };
});

/**
 * 番組にチャプター情報が含まれているかを判定する
 */
const hasChapters = (program: GetDashboardPersonalizedProgramDetailResponseDto): boolean => {
  return program.chapters && program.chapters.length > 0;
};

/**
 * 投稿日時をフォーマット
 */
const formatPostDate = (date: Date | string): string => {
  const dateString = typeof date === 'string' ? date : date.toISOString();
  return utcToJstDateString(dateString, 'YYYY年M月D日');
};

/**
 * 投稿者のURLを取得
 */
const getAuthorUrl = (post: { authorId: string }): string => {
  // データソースに応じてURLを生成
  switch (props.program.dataSource.toLowerCase()) {
    case 'qiita':
      return `https://qiita.com/${post.authorId}`;
    case 'zenn':
      return `https://zenn.dev/${post.authorId}`;
    default:
      return '#';
  }
};

/**
 * 音声ファイルを指定時間へ移動して再生する
 * @param time 開始時間（秒）
 */
const seekTo = (time: number): void => {
  console.debug('seekTo', { time, playerExists: !!player.value });
  if (player.value) {
    try {
      player.value.currentTime = time;
      // 音声が読み込まれていない場合は読み込み完了を待つ
      if (player.value.readyState >= 2) {
        player.value.play().catch((error) => {
          console.error('音声再生エラー:', error);
        });
      } else {
        // 読み込み完了後に再生
        const onCanPlay = (): void => {
          player.value?.play().catch((error) => {
            console.error('音声再生エラー:', error);
          });
          player.value?.removeEventListener('canplay', onCanPlay);
        };
        player.value.addEventListener('canplay', onCanPlay);
      }
    } catch (error) {
      console.error('シーク操作エラー:', error);
    }
  } else {
    console.warn('音声プレイヤーが見つかりません');
  }
};

/**
 * 台本テキストを複数話者用にフォーマットする
 * Postel: や John: などの話者名で改行し、見やすく表示する
 */
const formatScriptForDisplay = (text: string | null): string => {
  if (!text) return '';

  // 話者名のパターン（Postel:, John: など）
  const speakerPattern = /(Postel:|John:)/g;

  // 話者名の前で改行
  return text.replace(speakerPattern, '\n$1').trim();
};

/**
 * 再生時間を監視して現在のチャプターを更新する
 */
const updateCurrentChapter = (): void => {
  if (!player.value || player.value.ended) {
    // 再生終了時はチャプターをリセット
    currentChapterIndex.value = -1;
    return;
  }

  const currentTime = player.value.currentTime;
  console.debug('updateCurrentChapter', {
    currentTime,
    chaptersLength: props.program.chapters.length,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const index = props.program.chapters.findIndex((chapter: any, _i) => {
    // パーソナルプログラムのチャプター時間はミリ秒単位なので秒に変換
    const startTime = chapter.startTime / 1000;
    const endTime = chapter.endTime / 1000;
    return currentTime >= startTime && currentTime < endTime;
  });

  currentChapterIndex.value = index;
  console.debug('currentChapterIndex updated', {
    currentChapterIndex: index,
    currentTime,
    postsLength: scriptData.value.posts.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chapters: props.program.chapters.map((c: any, i) => ({
      index: i,
      title: c.title,
      startTime: c.startTime / 1000,
      endTime: c.endTime / 1000,
      isCurrentChapter: i === index,
    })),
  });
};

/**
 * フィード編集ページに遷移する
 */
const goToFeedEdit = (): void => {
  console.log('goToFeedEdit called with feedId:', props.program.feedId);
  console.log('Full program data:', props.program);

  if (!props.program.feedId) {
    console.warn('feedId is not available for this program');
    // TODO: エラー通知を表示する場合はここに追加
    return;
  }

  navigateTo(`/app/feeds/${props.program.feedId}/edit`);
};
</script>

<style lang="css" scoped>
audio {
  width: 100%;
}
ol.chapter-list {
  list-style-position: outside;
  padding-left: 10px;
}
li.active-chapter,
p.active-chapter-script {
  background-color: #edeeee;
  font-weight: bold;
}

/* フィードリンクのスタイル */
.v-card-subtitle a {
  color: rgb(var(--v-theme-secondary));
  transition: color 0.2s ease;
  cursor: pointer;
}

.v-card-subtitle a:hover {
  color: rgb(var(--v-theme-secondary-darken-1));
  text-decoration: underline !important;
}

/* 台本表示で改行を有効にする */
.script-content {
  white-space: pre-line;
}
</style>
