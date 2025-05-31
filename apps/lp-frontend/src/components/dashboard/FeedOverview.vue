<template lang="pug">
SectionCard(
  :title="title"
  :icon="icon"
  :class="containerClass"
)
  template(#actions)
    slot(name="actions")

  v-list(v-if="feeds.length > 0")
    template(v-for="(feed, index) in feeds" :key="feed.id")
      FeedListItem(
        :feed="feed"
        @edit="handleEdit"
      )
      v-divider(v-if="index < feeds.length - 1")

  // 空状態
  .text-center.pa-8(v-else)
    v-icon(size="64" color="grey-lighten-1" class="mb-4") {{ emptyIcon }}
    .text-h6.text-grey {{ emptyMessage }}
    .text-body-2.text-grey-lighten-1 {{ emptySubMessage }}
    v-btn(
      v-if="showCreateButton"
      color="primary"
      class="mt-4"
      @click="handleCreateFeed"
    ) フィードを作成
</template>

<script setup lang="ts">
import FeedListItem from './FeedListItem.vue';
import SectionCard from './SectionCard.vue';

interface Feed {
  id: number;
  name: string;
  tagCount: number;
  authorCount: number;
  frequency: string;
  isActive: boolean;
}

interface Props {
  title?: string;
  icon?: string;
  feeds: Feed[];
  containerClass?: string;
  emptyIcon?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
  showCreateButton?: boolean;
}

interface Emits {
  (e: 'edit', feed: Feed): void;
  (e: 'create-feed'): void;
}

withDefaults(defineProps<Props>(), {
  title: 'パーソナルフィード',
  icon: 'mdi-rss',
  containerClass: '',
  emptyIcon: 'mdi-rss-off',
  emptyMessage: 'フィードがありません',
  emptySubMessage: 'フィードを作成して番組を取得してください',
  showCreateButton: true,
});

const emit = defineEmits<Emits>();

const handleEdit = (feed: Feed): void => {
  emit('edit', feed);
};

const handleCreateFeed = (): void => {
  emit('create-feed');
};
</script>

<style scoped>
/* フィード概要固有のスタイルがあれば追加 */
</style>
