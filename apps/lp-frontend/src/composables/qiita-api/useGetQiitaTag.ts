import type { NuxtApp } from '#app';
import type { QiitaTagApiResponse } from '~/types/qiita-api/qiita-posts';

/**
 * Qiita APIからタグ情報を取得する
 * @param app NuxtApp
 * @param tagId 取得するタグID
 * @returns タグが存在する場合はタグオブジェクト、存在しない場合はnullを返す
 */
export const useGetQiitaTag = async (
  app: NuxtApp,
  tagId: string,
): Promise<QiitaTagApiResponse | null> => {
  console.log(`useGetQiitaTag called`, { tagName: tagId });

  try {
    // QiitaのタグAPIでタグ情報を取得
    const response = await fetch(`https://qiita.com/api/v2/tags/${encodeURIComponent(tagId)}`);

    if (!response.ok) {
      console.error('Failed to get tag:', response.status);
      return null;
    }

    const tag = (await response.json()) as QiitaTagApiResponse;
    console.debug('Tag response:', tag);

    // タグが見つかったか確認（名前が完全一致したものがあるか）
    if (tag.id.toLowerCase() === tagId.toLowerCase()) {
      return tag;
    }

    return null;
  }
  catch (error) {
    console.error('Error getting tag:', error);
    return null;
  }
};
