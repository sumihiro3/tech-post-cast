<template lang="pug">
nav(v-if='props.pages > 1')
  ul.pagination
    //- SSRモードの場合
    template(v-if='props.mode === "ssr"')
      //- 最初のページへのボタン
      li
        button(:disabled='props.currentPage === 1', @click='navigateToPage(1)')
          span(aria-hidden='true') «
      //- 1ページ目へのボタン
      li(v-if='props.currentPage > 1')
        button(@click='navigateToPage(1)')
          | 1
      //- 現在のページが最初のページより2ページ後の場合は...を表示
      li(v-if='props.currentPage - 1 >= 3')
        span.pagination-skip
          | ...
      //- 現在のページより1ページ前へのボタン
      li(v-if='props.currentPage > 2')
        button(@click='navigateToPage(props.currentPage - 1)')
          | {{ props.currentPage - 1 }}
      //- 現在のページ
      li
        button.active(disabled)
          | {{ props.currentPage }}
      //- 現在のページより1ページ後へのボタン
      li(v-if='props.pages > props.currentPage + 1')
        button(@click='navigateToPage(props.currentPage + 1)')
          | {{ props.currentPage + 1 }}
      //- 現在のページが最後のページより2ページ前の場合は...を表示
      li(v-if='props.pages > props.currentPage + 2')
        span.pagination-skip
          | ...
      //- 最後のページへのボタン
      li(v-if='props.pages > props.currentPage')
        button(@click='navigateToPage(props.pages)')
          | {{ props.pages }}
      //- 最後のページへのボタン
      li
        button(:disabled='props.currentPage === props.pages', @click='navigateToPage(props.pages)')
          span(aria-hidden='true') »

    //- SSGモードの場合（既存の実装）
    template(v-else)
      //- 最初のページへのリンク
      li
        a(:href='`${props.linkPrefix}/1`')
          span(aria-hidden='true') «
      //- 1ページ目へのリンク
      li(v-if='props.currentPage > 1')
        a(:href='`${props.linkPrefix}/1`')
          | 1
      //- 現在のページが最初のページより2ページ後の場合は...を表示
      li(v-if='props.currentPage - 1 >= 3')
        span.pagination-skip
          | ...
      //- 現在のページより1ページ前へのリンク
      li(v-if='props.currentPage > 2')
        a(:href='`${props.linkPrefix}/${props.currentPage - 1}`')
          | {{ props.currentPage - 1 }}
      //- 現在のページ
      li
        a.active(:href='`${props.linkPrefix}/${props.currentPage}`')
          | {{ props.currentPage }}
      //- 現在のページより1ページ後へのリンク
      li(v-if='props.pages > props.currentPage + 1')
        a(:href='`${props.linkPrefix}/${props.currentPage + 1}`')
          | {{ props.currentPage + 1 }}
      //- 現在のページが最後のページより2ページ前の場合は...を表示
      li(v-if='props.pages > props.currentPage + 2')
        span.pagination-skip
          | ...
      //- 最後のページへのリンク
      li(v-if='props.pages > props.currentPage')
        a(:href='`${props.linkPrefix}/${props.pages}`')
          | {{ props.pages }}
      //- 最後のページへのリンク
      li
        a(:href='`${props.linkPrefix}/${props.pages}`')
          span(aria-hidden='true') »
</template>

<script setup lang="ts">
const props = defineProps<{
  /** 現在のページ */
  currentPage: number;
  /** 合計ページ数 */
  pages: number;
  /** リンクのPrefix */
  linkPrefix: string;
  /** レンダリングモード */
  mode?: 'ssr' | 'ssg';
}>();

/**
 * SSRモードでのページ遷移
 */
const navigateToPage = (page: number): void => {
  if (props.mode === 'ssr') {
    navigateTo(`${props.linkPrefix}/${page}`);
  }
};
</script>

<style lang="css" scoped>
nav {
  display: flex;
  justify-content: center;
}

.pagination {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
}

.pagination li {
  margin: 0 1px;
}

.pagination a,
.pagination button {
  color: black;
  float: left;
  padding: 8px 16px;
  text-decoration: none;
  transition: background-color 0.3s;
  border: 1px solid #ddd;
  margin: 0 4px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-skip {
  color: black;
  float: left;
  padding: 8px 16px;
  text-decoration: none;
  margin: 0 4px;
}

.pagination a.active,
.pagination button.active {
  background-color: #55c500;
  color: white;
  border: 1px solid #55c500;
}

.pagination a:hover:not(.active),
.pagination button:hover:not(.active):not(:disabled) {
  background-color: #ddd;
}
</style>
