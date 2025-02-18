import { z } from '@hono/zod-openapi';

/**
 * リスナーからのお便りの生成リクエストを表すスキーマ
 */
export const SendListenerLetterSchema = z
  .object({
    /** お便りの本文 */
    body: z.string().min(5).max(200).openapi({ example: 'こんにちは' }),

    /** お便りの送信者の名前 */
    penName: z.string().min(1).max(20).openapi({ example: '太郎' }),
  })
  .openapi('SendListenerLetterSchema');

/**
 * リスナーからのお便りを表すスキーマ
 */
export const ListenerLetterSchema = z
  .object({
    /** お便りのID */
    id: z.string(),

    /** お便りの本文 */
    body: z.string(),

    /** お便りの送信者の名前 */
    penName: z.string(),

    /** お便りの送信日時 */
    sentAt: z.date(),
  })
  .openapi('ListenerLetterSchema');
