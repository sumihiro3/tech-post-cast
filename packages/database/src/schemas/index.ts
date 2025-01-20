/**
 * OpenAI API の Structured Outputs で利用するスキーマ定義を記述する
 */
import { JsonValue } from '@prisma/client/runtime/library';
import { z } from 'zod';

/**
 * 記事の要約を表すスキーマ
 */
export const PostSummarySchema = z.object({
  postId: z.string().optional().describe('記事の ID'),
  title: z.string().optional().describe('記事タイトル'),
  summary: z.string().describe('記事の要約'),
});

/**
 * ヘッドライントピック番組の台本を表すスキーマ
 * HeadlineTopicProgramScript と同じ構造とする
 */
export const HeadlineTopicProgramScriptSchema = z.object({
  title: z.string().describe('番組タイトル'),
  intro: z.string().describe('イントロダクション'),
  posts: z.array(PostSummarySchema).describe('紹介記事の要約'),
  ending: z.string().describe('エンディング'),
});

/**
 * ヘッドライントピック番組のチャプターを表すスキーマ
 */
export const HeadlineTopicProgramChapterSchema = z.object({
  title: z.string().describe('チャプタータイトル'),
  startTime: z.number().describe('チャプターの開始位置（ミリ秒）'),
  endTime: z.number().describe('チャプターの終了位置（ミリ秒）'),
});

/**
 * ヘッドライントピック番組のチャプター一覧を表すスキーマ
 */
export const HeadlineTopicProgramChaptersSchema = z.array(
  HeadlineTopicProgramChapterSchema,
);


/**
 * Prisma 経由で取得したヘッドライントピック番組の台本情報（Json or string）をパースする
 * @param script 台本情報
 * @returns パース結果
 */
export const parseHeadlineTopicProgramScript = (
  script: JsonValue | string,
): z.infer<typeof HeadlineTopicProgramScriptSchema> => {
  if (typeof script === 'string') {
    try {
      script = JSON.parse(script);
    } catch (error) {
      throw new Error('台本のパース処理に失敗しました');
    }
  }
  const s = HeadlineTopicProgramScriptSchema.safeParse(script);
  if (!s.success) {
    throw new Error('台本のパース処理に失敗しました');
  }
  return s.data;
}

/**
 * Prisma 経由で取得したヘッドライントピック番組のチャプター情報（Json or string）をパースする
 * @param chapters チャプター情報
 * @returns パース結果
 */
export const parseHeadlineTopicProgramChapters = (
  chapters: JsonValue | string,
): z.infer<typeof HeadlineTopicProgramChaptersSchema> => {
  if (typeof chapters === 'string') {
    try {
      chapters = JSON.parse(chapters);
    } catch (error) {
      throw new Error('チャプターのパース処理に失敗しました');
    }
  }
  const c = HeadlineTopicProgramChaptersSchema.safeParse(chapters);
  if (!c.success) {
    throw new Error('チャプターのパース処理に失敗しました');
  }
  return c.data;
}

