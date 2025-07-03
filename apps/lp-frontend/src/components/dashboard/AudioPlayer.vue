<template lang="pug">
v-footer(
  v-if="currentProgram"
  app
  color="primary"
  class="border-t player-footer"
  height="80"
)
  v-container(fluid class="pa-1 pa-sm-2")
    .d-flex.align-center
      v-btn(
        icon
        class="mr-3"
        color="white"
        :size="$vuetify.display.mobile ? 'default' : 'large'"
        @click="handleTogglePlay"
      )
        v-icon {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}

      .flex-grow-1.mr-3
        .text-body-2.text-sm-subtitle-2.font-weight-medium.text-white {{ currentProgram.title }}
        .text-caption.text-grey-lighten-2 {{ currentProgram.feedName }}

      .d-flex.align-center(style="min-width: 200px;")
        span.text-caption.mr-2.text-white {{ formatTime(currentTime) }}
        v-slider(
          :model-value="currentTime"
          :max="currentProgram.totalTime"
          hide-details
          class="flex-grow-1"
          color="white"
          track-color="rgba(255,255,255,0.3)"
          thumb-color="white"
          @update:model-value="handleTimeUpdate"
        )
        span.text-caption.ml-2.text-white {{ formatTime(currentProgram.totalTime) }}

      v-btn(
        icon
        class="ml-3"
        color="white"
        size="small"
        @click="handleClose"
      )
        v-icon mdi-close
</template>

<script setup lang="ts">
interface ProgramWithTotalTime {
  id: number;
  title: string;
  feedName: string;
  totalTime: number;
}

interface Props {
  currentProgram: ProgramWithTotalTime | null;
  isPlaying: boolean;
  currentTime: number;
}

interface Emits {
  (e: 'toggle-play' | 'close'): void;
  (e: 'time-update', time: number): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleTogglePlay = (): void => {
  emit('toggle-play');
};

const handleTimeUpdate = (time: number): void => {
  emit('time-update', time);
};

const handleClose = (): void => {
  emit('close');
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.player-footer {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>
