<template lang="pug">

v-card(
  class="mb-4"
  elevation="0"
)
  v-card-item
    .d-flex
      v-avatar(size="64" class="mr-4")
        v-img(
          :src="article.authorAvatar"
          :alt="article.author"
          cover
        )

      .flex-grow-1
        .d-flex.justify-space-between
          .text-h6.font-weight-medium {{ article.title }}

        .text-body-2.text-medium-emphasis @{{ article.author }} • {{ article.publishedAt }}

        .text-body-2.text-medium-emphasis.mt-1.text-truncate-2 {{ article.description }}

        .d-flex.justify-space-between.align-center.mt-2
          div
            v-chip(
              v-for="tag in article.tags"
              :key="tag"
              size="x-small"
              class="mr-1"
              variant="flat"
            ) {{ tag }}
          .d-flex.align-center
            v-icon(size="small" class="mr-1") mdi-thumb-up
            span.text-caption {{ article.lgtmCount }}
            v-icon(size="small" class="ml-2 mr-1") mdi-comment
            span.text-caption {{ article.commentCount }}
</template>

<script setup lang="ts">
import type { Article } from '@/pages/app/program-filter.vue';

defineProps<{
  article: Article;
}>();
</script>
