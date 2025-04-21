import type { NuxtApp } from '#app';
import type { QiitaUserApiResponse } from '~/types/qiita-api/qiita-posts';

/**
 * Qiita APIからユーザー情報を取得する
 * @param app NuxtApp
 * @param userId 取得するユーザーID
 * @returns ユーザーが存在する場合はユーザーオブジェクト、存在しない場合はnullを返す
 */
export const useGetQiitaAuthor = async (
  app: NuxtApp,
  userId: string,
): Promise<QiitaUserApiResponse | null> => {
  console.log(`useGetQiitaAuthor called`, { userId });

  try {
    if (!userId) return null;

    // Qiitaのユーザー情報APIを呼び出す
    const response = await fetch(`https://qiita.com/api/v2/users/${encodeURIComponent(userId)}`);

    if (!response.ok) {
      console.error('Failed to get author:', response.status);
      return null;
    }

    const user = (await response.json()) as QiitaUserApiResponse;
    console.debug('Author response:', user);

    // ユーザーIDが完全一致したものがあるか確認（大文字小文字区別なし）
    if (user.id.toLowerCase() === userId.toLowerCase()) {
      return user;
    }

    return null;
  }
  catch (error) {
    console.error('Error getting author:', error);
    return null;
  }
};
