<template lang="pug">
v-list-item.py-3
  v-list-item-content
    .d-flex.align-center.mb-1
      v-list-item-title.font-weight-medium.mr-2 {{ feed.name }}
      v-chip(
        :color="feed.isActive ? 'success' : 'grey'"
        size="x-small"
      ) {{ feed.isActive ? '有効' : '無効' }}
    v-list-item-subtitle.d-flex.align-center
      span.mr-3
        v-icon.mr-1(size="small") mdi-tag-multiple
        | {{ feed.tagCount }}個のタグ
      span.mr-3
        v-icon.mr-1(size="small") mdi-account-multiple
        | {{ feed.authorCount }}人の著者
      span
        v-icon.mr-1(size="small") mdi-calendar
        | {{ feed.frequency }}

  template(#append)
    v-btn(
      icon
      size="small"
      variant="text"
      @click="handleEditClick"
    )
      v-icon mdi-pencil
</template>

<script setup lang="ts">
interface Feed {
  id: number;
  name: string;
  tagCount: number;
  authorCount: number;
  frequency: string;
  isActive: boolean;
}

interface Props {
  feed: Feed;
}

interface Emits {
  (e: 'edit', feed: Feed): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleEditClick = (): void => {
  emit('edit', props.feed);
};
</script>

<style scoped>
/* フィードアイテム固有のスタイルがあれば追加 */
</style>
