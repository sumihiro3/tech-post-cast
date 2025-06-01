<template lang="pug">
v-list-item.py-3
  template(#prepend)
    v-btn(
      icon
      size="small"
      color="primary"
      @click="handlePlayClick"
    )
      v-icon {{ program.isPlaying ? 'mdi-pause' : 'mdi-play' }}

  v-list-item-title.font-weight-medium {{ program.title }}
  v-list-item-subtitle.d-flex.align-center.mt-1
    v-chip(
      :color="program.feedColor"
      size="x-small"
      class="mr-2 cursor-pointer"
      @click="handleFeedClick"
    ) {{ program.feedName }}
    span.mr-2 {{ program.date }}
    v-icon.mr-1(size="small") mdi-clock-outline
    span {{ program.duration }}

  template(#append)
    v-btn(
      color="primary"
      size="small"
      variant="outlined"
      @click="handleDetailsClick"
    )
      v-icon.mr-1 mdi-information-outline
      | 詳細
</template>

<script setup lang="ts">
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
  program: Program;
}

interface Emits {
  (e: 'play' | 'details', program: Program): void;
  (e: 'feed-click', feedName: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handlePlayClick = (): void => {
  emit('play', props.program);
};

const handleFeedClick = (): void => {
  emit('feed-click', props.program.feedName);
};

const handleDetailsClick = (): void => {
  emit('details', props.program);
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
