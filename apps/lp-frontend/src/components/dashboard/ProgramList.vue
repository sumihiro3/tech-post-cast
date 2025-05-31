<template lang="pug">
SectionCard(
  :title="title"
  :icon="icon"
  :class="containerClass"
)
  template(#actions)
    slot(name="actions")

  v-list(v-if="programs.length > 0")
    template(v-for="(program, index) in programs" :key="program.id")
      ProgramListItem(
        :program="program"
        @play="handlePlay"
        @feed-click="handleFeedClick"
        @details="handleDetails"
      )
      v-divider(v-if="index < programs.length - 1")

  // 空状態
  .text-center.pa-8(v-else)
    v-icon(size="64" color="grey-lighten-1" class="mb-4") {{ emptyIcon }}
    .text-h6.text-grey {{ emptyMessage }}
    .text-body-2.text-grey-lighten-1 {{ emptySubMessage }}
</template>

<script setup lang="ts">
import ProgramListItem from './ProgramListItem.vue';
import SectionCard from './SectionCard.vue';

interface Program {
  id: number;
  title: string;
  date: string;
  duration: string;
  feedName: string;
  feedColor: string;
  isPlaying: boolean;
}

interface Props {
  title: string;
  icon: string;
  programs: Program[];
  containerClass?: string;
  emptyIcon?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
}

interface Emits {
  (e: 'play' | 'details', program: Program): void;
  (e: 'feed-click', feedName: string): void;
}

const emit = defineEmits<Emits>();

withDefaults(defineProps<Props>(), {
  containerClass: '',
  emptyIcon: 'mdi-radio-off',
  emptyMessage: '番組がありません',
  emptySubMessage: 'フィードを設定して番組を取得してください',
});

const handlePlay = (program: Program): void => {
  emit('play', program);
};

const handleFeedClick = (feedName: string): void => {
  emit('feed-click', feedName);
};

const handleDetails = (program: Program): void => {
  emit('details', program);
};
</script>

<style scoped>
/* 番組リスト固有のスタイルがあれば追加 */
</style>
