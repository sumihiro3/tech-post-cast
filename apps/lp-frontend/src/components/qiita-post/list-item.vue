<template lang="pug">
v-card(
  class="mb-4"
  elevation="0"
)
  v-card-item
    .d-flex
      v-avatar(size="64" class="mr-4")
        v-img(
          :src="post.user.profile_image_url"
          :alt="post.user.name"
          cover
        )

      .flex-grow-1
        .d-flex.justify-space-between
          .text-h6.font-weight-medium {{ post.title }}

        .text-body-2.text-medium-emphasis @{{ post.user.name }} • {{ post.created_at }}

        //- 記事の本文のうち100文字を表示する
        .text-body-2.text-medium-emphasis.mt-1.text-truncate-2 {{ post.body.slice(0, 100) }}

        .d-flex.justify-space-between.align-center.mt-2
          div(v-if="post.tags")
            v-chip(
              v-for="tag in post.tags"
              :key="tag.name"
              size="x-small"
              class="mr-1"
              variant="flat"
            ) {{ tag.name }}
          .d-flex.align-center
            v-icon(size="small" class="mr-1") mdi-thumb-up
            span.text-caption {{ post.likes_count }}
            v-icon(size="small" class="ml-2 mr-1") mdi-comment
            span.text-caption {{ post.comments_count }}
</template>

<script setup lang="ts">
import type { QiitaPostDto } from '@/api';

defineProps<{
  post: QiitaPostDto;
}>();
</script>
