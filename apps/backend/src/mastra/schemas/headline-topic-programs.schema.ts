import { z } from 'zod';

/**
 * ヘッドライントピック番組中で紹介する記事の解説文を表すスキーマ
 */
export const headlineTopicProgramPostDescriptionSchema = z
  .object({
    id: z.string().describe('記事のID'),
    title: z.string().describe('記事のタイトル'),
    intro: z.string().describe('記事解説の「導入」部分'),
    explanation: z.string().describe('記事解説の「ポイントごとの解説」部分'),
    summary: z.string().describe('記事解説の「まとめ」部分'),
  })
  .describe('ヘッドライントピック番組中で紹介する記事の解説文を表すスキーマ');

/**
 * ヘッドライントピック番組中で紹介する記事の解説文を表す型
 */
export type HeadlineTopicProgramPostDescription = z.infer<
  typeof headlineTopicProgramPostDescriptionSchema
>;

/**
 * ヘッドライントピック番組の台本を表すスキーマ
 * personalizedProgramScriptSchemaと同じ構造
 * 話者モードの違いは各フィールドの内容で表現
 */
export const headlineTopicProgramScriptSchema = z
  .object({
    title: z.string().describe('番組のタイトル'),
    opening: z.string().describe('番組のオープニング'),
    posts: z
      .array(headlineTopicProgramPostDescriptionSchema)
      .describe('番組で紹介する記事解説文のリスト'),
    ending: z.string().describe('番組のエンディング'),
  })
  .describe('ヘッドライントピック番組の台本');

/**
 * ヘッドライントピック番組の台本の型定義
 */
export type HeadlineTopicProgramScript = z.infer<
  typeof headlineTopicProgramScriptSchema
>;

/**
 * ヘッドライントピック番組のワークフロー入力を表すスキーマ
 */
export const headlineTopicProgramInputSchema = z
  .object({
    programName: z.string().describe('番組名'),
    posts: z
      .array(
        z.object({
          id: z.string().describe('記事のID'),
          title: z.string().describe('記事のタイトル'),
          summary: z.string().describe('記事の要約'),
          keyPoints: z.array(z.string()).describe('記事の要点'),
          author: z.string().describe('記事の作者'),
          tags: z.array(z.string()).describe('記事のタグ'),
          createdAt: z.string().describe('記事の作成日時'),
        }),
      )
      .describe('紹介する記事のリスト'),
    programDate: z.date().describe('番組の作成日'),
    listenerLetters: z
      .array(
        z.object({
          id: z.string().describe('お便りのID'),
          penName: z.string().describe('お便りを送信したユーザーのペンネーム'),
          body: z.string().describe('お便りの内容'),
        }),
      )
      .optional()
      .describe('リスナーからのお便りのリスト'),
    speakerMode: z.enum(['SINGLE', 'MULTI']).describe('話者モード'),
  })
  .describe('ヘッドライントピック番組のワークフロー入力');

/**
 * ヘッドライントピック番組のワークフロー入力の型定義
 */
export type HeadlineTopicProgramInput = z.infer<
  typeof headlineTopicProgramInputSchema
>;

/**
 * リスナーからのお便りとその回答を表すスキーマ
 * ヘッドライントピック番組専用（リスナーお便りはエンディング部分に含める）
 */
export const listenerLetterWithResponseSchema = z
  .object({
    id: z.string().describe('お便りのID'),
    penName: z.string().describe('お便りを送信したユーザーのペンネーム'),
    content: z.string().describe('お便りの内容'),
    response: z.string().describe('お便りへの回答'),
  })
  .describe('リスナーからのお便りとその回答を表すスキーマ');

/**
 * リスナーからのお便りとその回答を表す型
 */
export type ListenerLetterWithResponse = z.infer<
  typeof listenerLetterWithResponseSchema
>;
