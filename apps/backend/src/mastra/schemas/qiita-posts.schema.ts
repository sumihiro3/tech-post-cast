import { z } from 'zod';

/**
 * Qiita 記事情報のスキーマ定義
 */
export const qiitaPostSchema = z
  .object({
    id: z.string().describe('記事のID'),
    title: z.string().describe('記事のタイトル'),
    content: z.string().describe('記事の内容'),
    author: z.string().describe('記事の作者'),
    tags: z.array(z.string()).describe('記事のタグ'),
    createdAt: z.string().describe('記事の作成日時'),
  })
  .describe('Qiita 記事情報のスキーマ');

/**
 * Qiita 記事情報の型定義
 */
export type QiitaPost = z.infer<typeof qiitaPostSchema>;

/**
 * Qiita 記事の要約を表すスキーマ定義
 */
export const summarizedQiitaPostSchema = z
  .object({
    id: z.string().describe('記事のID'),
    title: z.string().describe('記事のタイトル'),
    summary: z.string().describe('要約の内容'),
    author: z.string().describe('記事の作者'),
    tags: z.array(z.string()).describe('記事のタグ'),
    createdAt: z.string().describe('記事の作成日時'),
  })
  .describe('Qiita 記事の要約を表すスキーマ');

/**
 * Qiita 記事の要約の型定義
 */
export type SummarizedQiitaPost = z.infer<typeof summarizedQiitaPostSchema>;
