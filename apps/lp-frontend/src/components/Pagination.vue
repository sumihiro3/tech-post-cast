<template lang="pug">
nav(v-if='pages > 1')
  ul.pagination
    //- 最初のページへのリンク
    li
      a(:href='`${linkPrefix}/1`')
        span(aria-hidden='true') «
    //- 1ページ目へのリンク
    li(v-if='currentPage > 1')
      a(:href='`${linkPrefix}/1`')
        | 1
    //- 現在のページが最初のページより2ページ後の場合は...を表示
    li(v-if='currentPage - 1 >= 3')
      span.pagination-skip
        | ...
    //- 現在のページより1ページ前へのリンク
    li(v-if='currentPage > 2')
      a(:href='`${linkPrefix}/${currentPage - 1}`')
        | {{ currentPage - 1 }}
    //- 現在のページ
    li
      a.active(:href='`${linkPrefix}/${currentPage}`')
        | {{ currentPage }}
    //- 現在のページより1ページ後へのリンク
    li(v-if='pages > currentPage + 1')
      a(:href='`${linkPrefix}/${currentPage + 1}`')
        | {{ currentPage + 1 }}
    //- 現在のページが最後のページより2ページ前の場合は...を表示
    li(v-if='pages > currentPage + 2')
      span.pagination-skip
        | ...
    //- 最後のページへのリンク
    li(v-if='pages > currentPage')
      a(:href='`${linkPrefix}/${pages}`')
        | {{ pages }}
    //- 最後のページへのリンク
    li
      a(:href='`${linkPrefix}/${pages}`')
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
}>();

const maxVisiblePages = 3;
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

.pagination a {
  color: black;
  float: left;
  padding: 8px 16px;
  text-decoration: none;
  transition: background-color 0.3s;
  border: 1px solid #ddd;
  margin: 0 4px;
}

.pagination-skip {
  color: black;
  float: left;
  padding: 8px 16px;
  text-decoration: none;
  margin: 0 4px;
}

.pagination a.active {
  background-color: #4caf50;
  color: white;
  border: 1px solid #4caf50;
}

.pagination a:hover:not(.active) {
  background-color: #ddd;
}
</style>
