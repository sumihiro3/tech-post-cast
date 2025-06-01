<template lang="pug">
v-card.ma-1.pa-3.pa-md-4.mb-6.mb-md-8.bg-white(flat, rounded='lg', elevation='2')
  // 1. 番組タイトル（詳細画面へのリンク）
  v-card-title.text-h6.text-md-h5.font-weight-black.pb-2
    a.text-decoration-none.text-inherit(
      @click="goToDetail"
    ) {{ program.title }}

  // 2. 番組生成日時
  v-card-subtitle.text-caption.text-md-body-2.pb-3
    .d-flex.align-center
      v-icon.mr-2(size='16', color='primary') mdi-calendar
      span {{ utcToJstDateString(program.createdAt) }} に生成

  // 3. オーディオプレイヤー
  v-card-text.pt-0.pb-3
    audio(
      ref='player',
      controls,
      preload='auto'
    )
      source(:src='program.audioUrl', type='audio/mpeg')

  // 4. パーソナルフィード
  v-card-text.pt-0.pb-2
    .d-flex.align-center
      v-icon.mr-2(size='16', color='secondary') mdi-rss
      span パーソナルフィード；
      span.ml-1.text-decoration-none.font-weight-medium(
        v-if="!program.feedId"
      ) {{ program.feedName }} (削除済み)
      a.ml-1.text-decoration-none.font-weight-medium(
        v-else
        @click="goToFeedEdit"
      ) {{ program.feedName }}

  // 5. 紹介記事数
  v-card-text.pt-0.pb-3
    .d-flex.align-center
      v-icon.mr-2(size='16', color='info') mdi-file-document-multiple
      span 紹介記事数：{{ program.postsCount }}件

  // 追加情報（音声時間・有効期限）
  v-card-text.pt-0.pb-3(v-if='program.audioDuration || program.expiresAt')
    .d-flex.flex-column.flex-md-row.align-start.align-md-center.ga-2.ga-md-4.text-caption.text-md-body-2
      // 音声時間
      .d-flex.align-center(v-if='program.audioDuration')
        v-icon.mr-2(size='16') mdi-clock
        span 番組時間：{{ formatDuration(program.audioDuration) }}

      // 有効期限
      .d-flex.align-center(v-if='program.expiresAt')
        v-icon.mr-2(size='16', :color='program.isExpired ? "error" : "success"') mdi-calendar-clock
        span(
          :class='program.isExpired ? "text-error" : "text-success"'
        ) {{ program.isExpired ? '期限切れ' : `${formatExpiryDate(program.expiresAt)}まで有効` }}

  // 6. 番組詳細ボタン（目立つblock表示）
  v-card-actions.pt-0
    v-btn(
      color="primary"
      variant="elevated"
      size="large"
      block
      @click="goToDetail"
    )
      v-icon.mr-2(size="20") mdi-play-circle-outline
      | 番組を聴く・詳細を見る
</template>

<script lang="ts" setup>
import type { PersonalizedProgramSummaryDto } from '@/api';

interface Properties {
  /** パーソナルプログラム */
  program: PersonalizedProgramSummaryDto;
}

/** コンポーネントのプロパティ */
const props = defineProps<Properties>();

const { utcToJstDateString } = useDateUtil();

// Audio Player
const player = ref<HTMLAudioElement | null>(null);

/**
 * 詳細ページに遷移
 */
const goToDetail = (): void => {
  navigateTo(`/app/programs/${props.program.id}`);
};

/**
 * フィード編集ページに遷移
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
</script>

<style lang="css" scoped>
audio {
  width: 100%;
}

a {
  color: rgb(var(--v-theme-secondary));
  transition: color 0.2s ease;
  cursor: pointer;
}

a:hover {
  color: rgb(var(--v-theme-secondary-darken-1));
  text-decoration: underline !important;
}

/* タイトルリンクのスタイル */
.v-card-title a {
  color: inherit;
  transition: color 0.2s ease;
  cursor: pointer;
}

.v-card-title a:hover {
  color: rgb(var(--v-theme-primary));
  text-decoration: none !important;
}
</style>
