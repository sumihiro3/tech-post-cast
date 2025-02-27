import type { NuxtApp } from '#app';
import type { ListenerLetterSchema } from '@/api';

/**
 * リスナーからのお便りを送信する
 * @param app Nuxtアプリケーション
 * @param penName ペンネーム
 * @param body お便りの本文
 * @returns お便りの送信結果
 */
export const useSendListenerLetters = async (
  app: NuxtApp,
  penName: string,
  body: string,
  liffAccessToken: string,
): Promise<ListenerLetterSchema> => {
  console.debug(`useSendListenerLetters called`, { penName, body });
  const response = await app.$defaultApi.apiLiffListenerLettersPost({
    penName,
    body,
  }, {
    headers: {
      Authorization: `Bearer ${liffAccessToken}`,
    },
  });
  console.log(`お便りの送信結果`, { response });
  const dto = response.data;
  return dto;
};
