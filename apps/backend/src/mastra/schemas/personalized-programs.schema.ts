import { z } from 'zod';

/**
 * パーソナルプログラム中で紹介する記事の解説文を表すスキーマ
 */
export const personalizedProgramPostDescriptionSchema = z
  .object({
    id: z.string().describe('記事のID'),
    title: z.string().describe('記事のタイトル'),
    intro: z.string().describe('記事解説の「導入」部分'),
    explanation: z.string().describe('記事解説の「ポイントごとの解説」部分'),
    summary: z.string().describe('記事解説の「まとめ」部分'),
  })
  .describe('パーソナルプログラム中で紹介する記事の解説文を表すスキーマ');

/**
 * パーソナルプログラム中で紹介する記事の解説文を表す型
 */
export type PersonalizedProgramPostDescription = z.infer<
  typeof personalizedProgramPostDescriptionSchema
>;

/**
 * パーソナルプログラムの台本を表すスキーマ
 */
export const personalizedProgramScriptSchema = z
  .object({
    title: z.string().describe('番組のタイトル'),
    opening: z.string().describe('番組のオープニング'),
    posts: z
      .array(personalizedProgramPostDescriptionSchema)
      .describe('番組で紹介する記事解説文のリスト'),
    ending: z.string().describe('番組のエンディング'),
  })
  .describe('パーソナルプログラムの台本を表すスキーマ');

/**
 * パーソナルプログラムの台本を表す型
 */
export type PersonalizedProgramScript = z.infer<
  typeof personalizedProgramScriptSchema
>;
