<template lang="pug">
v-card.program-list-card(elevation="2")
  v-card-title.d-flex.align-center.justify-space-between
    .d-flex.align-center
      v-icon.mr-2(color="primary") mdi-podcast
      span 最新のパーソナルプログラム
    v-chip(
      v-if="totalCount > 0"
      color="primary"
      variant="flat"
      size="small"
    ) {{ totalCount }}件

  v-card-text
    // ローディング状態
    v-skeleton-loader(
      v-if="loading && programs.length === 0"
      type="list-item-avatar-three-line, divider, list-item-avatar-three-line, divider, list-item-avatar-three-line"
    )

    // エラー状態
    v-alert(
      v-else-if="error"
      type="error"
      variant="tonal"
      :text="error.message"
    )

    // プログラム一覧表示
    div(v-else-if="programs.length > 0")
      v-list.bg-transparent(density="compact")
        template(v-for="(program, index) in programs" :key="program.id")
          v-list-item(
            :title="program.title"
            :subtitle="formatProgramSubtitle(program)"
            class="program-item"
            @click="handleProgramClick(program)"
          )
            template(#prepend)
              v-avatar(
                v-if="program.imageUrl"
                :image="program.imageUrl"
                size="56"
              )
              v-avatar(
                v-else
                color="primary"
                size="56"
              )
                v-icon(color="white") mdi-podcast
            template(#append)
              v-chip(
                :color="program.isExpired ? 'error' : 'success'"
                variant="flat"
                size="x-small"
              ) {{ program.isExpired ? '期限切れ' : '有効' }}

          v-divider(v-if="index < programs.length - 1")

    // データなし状態
    v-alert(
      v-else
      type="info"
      variant="tonal"
      text="まだパーソナルプログラムが作成されていません。"
    )
      template(#append)
        v-btn(
          color="primary"
          variant="elevated"
          size="small"
          @click="handleCreateFeed"
        )
          v-icon.mr-2 mdi-plus
          | フィード作成

  // カードアクション
  v-card-actions(v-if="programs.length > 0")
    v-spacer
    v-btn(
      color="primary"
      variant="text"
      @click="handleViewAll"
    )
      | すべて表示
      v-icon.ml-2 mdi-arrow-right
</template>

<script setup lang="ts">
import type { PersonalizedProgramSummaryDto } from '@/api';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
  programs: PersonalizedProgramSummaryDto[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
}

defineProps<Props>();

// プログラムのサブタイトルをフォーマット
const formatProgramSubtitle = (program: PersonalizedProgramSummaryDto): string => {
  const parts: string[] = [];

  // フィード名
  parts.push(`フィード: ${program.feedName}`);

  // 記事数
  parts.push(`${program.postsCount}記事`);

  // 音声時間
  if (program.audioDuration) {
    const minutes = Math.floor(program.audioDuration / (1000 * 60));
    parts.push(`${minutes}分`);
  }

  // 作成日時
  const createdAt = new Date(program.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: ja,
  });
  parts.push(timeAgo);

  return parts.join(' • ');
};

// プログラムクリック処理
const handleProgramClick = (program: PersonalizedProgramSummaryDto): void => {
  console.log('プログラム詳細へ遷移:', program.id);
  navigateTo(`/app/programs/${program.id}`);
};

// フィード作成処理
const handleCreateFeed = (): void => {
  console.log('フィード作成ページへ遷移');
  navigateTo('/app/feeds/create');
};

// すべて表示処理
const handleViewAll = (): void => {
  console.log('プログラム一覧ページへ遷移');
  navigateTo('/app/programs');
};
</script>

<style scoped>
.program-list-card {
  /* height: 100%を削除してコンテンツに応じた高さにする */
}

.program-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.program-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
