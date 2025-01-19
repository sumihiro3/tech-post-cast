/**
 * OpenAI API の Structured Outputs で利用するスキーマ定義を記述する
 */
import { z } from 'zod';

/**
 * 記事の要約を表すスキーマ
 */
export const PostSummarySchema = z.object({
  postId: z.string().describe('記事の ID'),
  title: z.string().describe('記事タイトル'),
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
