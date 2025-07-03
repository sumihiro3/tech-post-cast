/**
 * Qiita API用Zodスキーマ定義
 */
import { z } from 'zod';

/**
 * Qiita User スキーマ
 */
export const qiitaUserSchema = z.object({
  /** ユーザーの一意なID */
  id: z.string().describe('ユーザーの一意なID'),
  /** 自己紹介文 */
  description: z.string().optional().describe('自己紹介文'),
  /** Facebook ID */
  facebook_id: z.string().optional().describe('Facebook ID'),
  /** このユーザーがフォローしているユーザーの数 */
  followees_count: z.number().describe('このユーザーがフォローしているユーザーの数'),
  /** このユーザーをフォローしているユーザーの数 */
  followers_count: z.number().describe('このユーザーをフォローしているユーザーの数'),
  /** GitHub ID */
  github_login_name: z.string().optional().describe('GitHub ID'),
  /** このユーザーが qiita.com 上で公開している記事の数 (Qiita Teamでの記事数は含まれません) */
  items_count: z
    .number()
    .describe(
      'このユーザーが qiita.com 上で公開している記事の数 (Qiita Teamでの記事数は含まれません)',
    ),
  /** LinkedIn ID */
  linkedin_id: z.string().optional().describe('LinkedIn ID'),
  /** 居住地 */
  location: z.string().optional().describe('居住地'),
  /** ユーザー名 */
  name: z.string().optional().describe('ユーザー名'),
  /** 所属している組織 */
  organization: z.string().optional().describe('所属している組織'),
  /** ユーザーごとに割り当てられる整数のID */
  permanent_id: z.number().describe('ユーザーごとに割り当てられる整数のID'),
  /** 設定しているプロフィール画像のURL */
  profile_image_url: z.string().describe('設定しているプロフィール画像のURL'),
  /** Qiita Team専用モードに設定されているかどうか */
  team_only: z.boolean().describe('Qiita Team専用モードに設定されているかどうか'),
  /** Twitterのスクリーンネーム */
  twitter_screen_name: z.string().optional().describe('Twitterのスクリーンネーム'),
  /** 設定しているWebサイトのURL */
  website_url: z.string().optional().describe('設定しているWebサイトのURL'),
});

/**
 * Qiita グループスキーマ
 */
export const qiitaGroupSchema = z.object({
  /** データが作成された日時 */
  created_at: z.string().describe('データが作成された日時'),
  /** グループの詳細 */
  description: z.string().describe('グループの詳細'),
  /** グループに付けられた表示用の名前 */
  name: z.string().describe('グループに付けられた表示用の名前'),
  /** 非公開グループかどうか */
  private: z.boolean().describe('非公開グループかどうか'),
  /** データが最後に更新された日時 */
  updated_at: z.string().describe('データが最後に更新された日時'),
  /** グループのチーム上での一意な名前 */
  url_name: z.string().describe('グループのチーム上での一意な名前'),
});

/**
 * Qiita チームメンバースキーマ
 */
export const qiitaTeamMembershipSchema = z.object({
  /** チームに登録しているユーザー名 */
  name: z.string().describe('チームに登録しているユーザー名'),
});

/**
 * Qiita 記事のタグスキーマ
 */
export const qiitaTagSchema = z.object({
  /** タグ名 */
  name: z.string().describe('タグ名'),
  versions: z.array(z.string()).describe('タグに関連するバージョン情報'),
});

/**
 * Qiita 記事情報スキーマ
 */
export const qiitaPostSchema = z.object({
  /** 記事の一意なID */
  id: z.string().describe('記事の一意なID'),
  /** 記事のタイトル */
  title: z.string().describe('記事のタイトル'),
  /** HTML形式の本文 */
  rendered_body: z.string().describe('HTML形式の本文'),
  /** 記事の本文 */
  body: z.string().describe('記事の本文（Markdown形式）'),
  /** 記事のURL */
  url: z.string().describe('記事のURL'),
  /** 記事が作成された日時 */
  created_at: z.string().describe('記事が作成された日時'),
  /** 記事の最終更新日時 */
  updated_at: z.string().describe('記事の最終更新日時'),
  /** 記事投稿者 */
  user: qiitaUserSchema.describe('記事投稿者の情報'),
  /** この記事へのコメントの数 */
  comments_count: z.number().describe('この記事へのコメントの数'),
  /** この記事へのいいねの数 */
  likes_count: z.number().describe('この記事へのいいねの数'),
  /** 絵文字リアクションの数（Qiita Teamでのみ有効） */
  reactions_count: z.number().describe('絵文字リアクションの数（Qiita Teamでのみ有効）'),
  /** この記事がストックされた数 */
  stocks_count: z.number().describe('この記事がストックされた数'),
  /** 限定共有状態かどうかを表すフラグ */
  private: z.boolean().describe('限定共有状態かどうかを表すフラグ'),
  /** 記事に付いたタグ一覧 */
  tags: z.array(qiitaTagSchema).describe('記事に付いたタグ一覧'),
  /** この記事が共同更新状態かどうか (Qiita Teamでのみ有効) */
  coediting: z.boolean().describe('この記事が共同更新状態かどうか (Qiita Teamでのみ有効)'),
  /** Qiita Teamのグループ */
  group: qiitaGroupSchema.describe('Qiita Teamのグループ情報'),
  /** 閲覧数 */
  page_views_count: z.number().optional().describe('記事の閲覧数'),
  /** Qiita Team のチームメンバー情報 */
  team_membership: qiitaTeamMembershipSchema.describe('Qiita Team のチームメンバー情報'),
  /** 記事のOrganization の url_name */
  organization_url_name: z.string().optional().describe('記事のOrganization の url_name'),
  /** スライドモードが有効を表すフラグ */
  slide: z.boolean().describe('スライドモードが有効を表すフラグ'),
  /** 記事の要約 */
  summary: z.string().optional().describe('記事の要約'),
});

/**
 * Qiita記事の検索結果スキーマ（ページネーション情報付き）
 */
export const qiitaPostsSearchResultSchema = z.object({
  /** 検索結果の記事一覧 */
  posts: z.array(qiitaPostSchema).describe('検索結果の記事一覧'),
  /** 検索結果の総件数 */
  totalCount: z.number().describe('検索結果の総件数'),
  /** 現在のページ番号 */
  page: z.number().describe('現在のページ番号'),
  /** 1ページあたりの件数 */
  perPage: z.number().describe('1ページあたりの件数'),
});

// ルートスキーマにも説明を追加
export const qiitaUserSchemaWithDescription = qiitaUserSchema.describe('Qiitaユーザー情報');
export const qiitaGroupSchemaWithDescription = qiitaGroupSchema.describe('Qiitaグループ情報');
export const qiitaTeamMembershipSchemaWithDescription =
  qiitaTeamMembershipSchema.describe('Qiitaチームメンバーシップ情報');
export const qiitaTagSchemaWithDescription = qiitaTagSchema.describe('Qiita記事のタグ情報');
export const qiitaPostSchemaWithDescription = qiitaPostSchema.describe('Qiita記事情報');
export const qiitaPostsSearchResultSchemaWithDescription = qiitaPostsSearchResultSchema.describe(
  'Qiita記事の検索結果（ページネーション情報付き）',
);

// 型定義のエクスポート
export type QiitaUserSchema = z.infer<typeof qiitaUserSchema>;
export type QiitaGroupSchema = z.infer<typeof qiitaGroupSchema>;
export type QiitaTeamMembershipSchema = z.infer<typeof qiitaTeamMembershipSchema>;
export type QiitaTagSchema = z.infer<typeof qiitaTagSchema>;
export type QiitaPostSchema = z.infer<typeof qiitaPostSchema>;
export type QiitaPostsSearchResultSchema = z.infer<typeof qiitaPostsSearchResultSchema>;
