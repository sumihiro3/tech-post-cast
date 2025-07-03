import type { NuxtApp } from '#app';
import type { QiitaPostDto, SearchQiitaPostsResponseDto } from '@/api';
import { addDays } from 'date-fns';

/**
 * Qiita API で記事を取得する
 * @param authors 著者名の配列
 * @param tags タグの配列
 * @param daysAgo 何日前までの記事を取得するか（-1はすべて）
 */
export const useGetQiitaPosts = async (
  app: NuxtApp,
  authors?: string[],
  tags?: string[],
  daysAgo?: number,
): Promise<SearchQiitaPostsResponseDto> => {
  console.log(`useGetQiitaPosts called`, { authors, tags, daysAgo });
  try {
    // 引数が未指定の場合は空の配列を渡す
    // authorsとtagsは配列なので、join(',')で文字列に変換して渡す
    const authorsList = authors ? [authors.join(',')] : [];
    const tagsList = tags ? [tags.join(',')] : [];

    // daysAgoから日付文字列を生成（YYYY-MM-DD形式）
    // -1は「すべて」なのでundefinedにする
    let minPublishedAt: string | undefined = undefined;
    if (daysAgo !== undefined && daysAgo > 0) {
      const date = addDays(new Date(), -daysAgo);
      minPublishedAt = date.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換
    }

    // バックエンドAPIを呼び出す
    const response = await app.$qiitaPostApi.searchQiitaPosts(
      authorsList,
      tagsList,
      minPublishedAt,
    );
    const result = response.data;
    console.log(`Qiita API response`, { result });
    return result;
  } catch (error) {
    console.error(`useGetQiitaPosts error`, error);
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw error;
  }
};

/**
 * いいね数フィルター対応のQiita記事取得
 * @param app NuxtApp
 * @param authors 著者名の配列
 * @param tags タグの配列
 * @param daysAgo 何日前までの記事を取得するか
 * @param likesCount 最小いいね数（この数以上のいいねがある記事を対象）
 * @param maxResults 最大取得件数（デフォルト: 5）
 * @returns フィルターされた記事と取得状況
 */
export const useGetQiitaPostsWithLikesFilter = async (
  app: NuxtApp,
  authors?: string[],
  tags?: string[],
  daysAgo?: number,
  likesCount?: number,
  maxResults: number = 5,
): Promise<{
  posts: QiitaPostDto[];
  totalCount: number;
  hasMore: boolean;
  reachedMaxPages: boolean;
}> => {
  console.log(`useGetQiitaPostsWithLikesFilter called`, {
    authors,
    tags,
    daysAgo,
    likesCount,
    maxResults,
  });

  // いいね数フィルターが設定されていない場合は既存関数を使用
  if (!likesCount || likesCount <= 0) {
    const result = await useGetQiitaPosts(app, authors, tags, daysAgo);
    return {
      posts: result.posts,
      totalCount: result.totalCount,
      hasMore: false,
      reachedMaxPages: false,
    };
  }

  try {
    // 引数の準備
    const authorsList = authors ? [authors.join(',')] : [];
    const tagsList = tags ? [tags.join(',')] : [];

    // daysAgoから日付文字列を生成（YYYY-MM-DD形式）
    let minPublishedAt: string | undefined = undefined;
    if (daysAgo !== undefined && daysAgo > 0) {
      const date = addDays(new Date(), -daysAgo);
      minPublishedAt = date.toISOString().split('T')[0];
    }

    // いいね数フィルター対応の処理
    const filteredPosts: QiitaPostDto[] = [];
    let page = 1;
    let reachedMaxPages = false;
    let totalPagesChecked = 0;
    const maxPagesToCheck = 10; // 最大10ページまでチェック（レート制限対策）

    while (filteredPosts.length < maxResults && totalPagesChecked < maxPagesToCheck) {
      try {
        console.log(`Fetching page ${page} for likes filter...`);

        const response = await app.$qiitaPostApi.searchQiitaPosts(
          authorsList,
          tagsList,
          minPublishedAt,
          page,
          100, // 1ページあたりの最大件数
        );

        const result = response.data;
        totalPagesChecked++;

        // いいね数でフィルタリング
        const likesFilteredPosts = result.posts.filter((post) => post.likes_count >= likesCount);
        filteredPosts.push(...likesFilteredPosts);

        console.log(
          `Page ${page}: found ${likesFilteredPosts.length} posts with ${likesCount}+ likes (total so far: ${filteredPosts.length})`,
        );

        // 最後のページに到達した場合は終了
        const totalPages = Math.ceil(result.totalCount / 100);
        if (page >= totalPages) {
          reachedMaxPages = true;
          console.log(`Reached last page (${page}/${totalPages})`);
          break;
        }

        page++;
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    const finalPosts = filteredPosts.slice(0, maxResults);
    const hasMore =
      filteredPosts.length > maxResults ||
      (!reachedMaxPages && totalPagesChecked >= maxPagesToCheck);

    console.log(`useGetQiitaPostsWithLikesFilter result:`, {
      postsFound: filteredPosts.length,
      postsReturned: finalPosts.length,
      hasMore,
      reachedMaxPages,
      totalPagesChecked,
    });

    return {
      posts: finalPosts,
      totalCount: filteredPosts.length,
      hasMore,
      reachedMaxPages,
    };
  } catch (error) {
    console.error(`useGetQiitaPostsWithLikesFilter error`, error);
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw error;
  }
};
