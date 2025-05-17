/**
 * Qiita User 型定義
 */
export interface QiitaUserApiResponse {
  /** ユーザーの一意なID */
  id: string;
  /** 自己紹介文 */
  description?: string;
  /** Facebook ID */
  facebook_id?: string;
  /** このユーザーがフォローしているユーザーの数 */
  followees_count: number;
  /** このユーザーをフォローしているユーザーの数 */
  followers_count: number;
  /** GitHub ID */
  github_login_name?: string;
  /** このユーザーが qiita.com 上で公開している記事の数 (Qiita Teamでの記事数は含まれません) */
  items_count: number;
  /** LinkedIn ID */
  linkedin_id?: string;
  /** 居住地 */
  location?: string;
  /** ユーザー名 */
  name?: string;
  /** 所属している組織 */
  organization?: string;
  /** ユーザーごとに割り当てられる整数のID */
  permanent_id: number;
  /** 設定しているプロフィール画像のURL */
  profile_image_url: string;
  /** Qiita Team専用モードに設定されているかどうか */
  team_only: boolean;
  /** Twitterのスクリーンネーム */
  twitter_screen_name?: string;
  /** 設定しているWebサイトのURL */
  website_url?: string;
}

/**
 * Qiita グループ情報
 */
export interface QiitaGroupApiResponse {
  /** データが作成された日時 */
  created_at: string;
  /** グループの詳細 */
  description: string;
  /** グループに付けられた表示用の名前 */
  name: string;
  /** 非公開グループかどうか */
  private: boolean;
  /** データが最後に更新された日時 */
  updated_at: string;
  /** グループのチーム上での一意な名前 */
  url_name: string;
}

/**
 * Qiita チームメンバー情報
 */
export interface QiitaTeamMembershipApiResponse {
  /** チームに登録しているユーザー名 */
  name: string;
}

/**
 * Qiita 記事のタグ情報
 */
export interface QiitaTagApiResponse {
  /** タグ名 */
  name: string;
  versions: string[];
}

/**
 * Qiita 記事情報 API レスポンスの型定義
 */
export interface IQiitaPostApiResponse {
  /** 記事の一意なID */
  id: string;
  /** 記事のタイトル */
  title: string;
  /** HTML形式の本文 */
  rendered_body: string;
  /** 記事の本文 */
  body: string;
  /** 記事のURL */
  url: string;
  /** 記事が作成された日時 */
  created_at: string;
  /** 記事の最終更新日時 */
  updated_at: string;
  /** 記事投稿者 */
  user: QiitaUserApiResponse;
  /** この記事へのコメントの数 */
  comments_count: number;
  /** この記事へのいいねの数 */
  likes_count: number;
  /** 絵文字リアクションの数（Qiita Teamでのみ有効） */
  reactions_count: number;
  /** この記事がストックされた数 */
  stocks_count: number;
  /** 限定共有状態かどうかを表すフラグ */
  private: boolean;
  /** 記事に付いたタグ一覧 */
  tags: QiitaTagApiResponse[];
  /** この記事が共同更新状態かどうか (Qiita Teamでのみ有効) */
  coediting: boolean;
  /** Qiita Teamのグループ */
  group: QiitaGroupApiResponse;
  /** 閲覧数 */
  page_views_count?: number;
  /** Qiita Team のチームメンバー情報 */
  team_membership: QiitaTeamMembershipApiResponse;
  /** 記事のOrganization の url_name */
  organization_url_name?: string;
  /** スライドモードが有効を表すフラグ */
  slide: boolean;
  /** 記事の要約 */
  summary?: string;
}

/**
 * Qiita 記事情報 API レスポンス
 */
export class QiitaPostApiResponse implements IQiitaPostApiResponse {
  /** 記事の一意なID */
  id: string;
  /** 記事のタイトル */
  title: string;
  /** HTML形式の本文 */
  rendered_body: string;
  /** 記事の本文 */
  body: string;
  /** 記事のURL */
  url: string;
  /** 記事が作成された日時 */
  created_at: string;
  /** 記事の最終更新日時 */
  updated_at: string;
  /** 記事投稿者 */
  user: QiitaUserApiResponse;
  /** この記事へのコメントの数 */
  comments_count: number;
  /** この記事へのいいねの数 */
  likes_count: number;
  /** 絵文字リアクションの数（Qiita Teamでのみ有効） */
  reactions_count: number;
  /** この記事がストックされた数 */
  stocks_count: number;
  /** 限定共有状態かどうかを表すフラグ */
  private: boolean;
  /** 記事に付いたタグ一覧 */
  tags: QiitaTagApiResponse[];
  /** この記事が共同更新状態かどうか (Qiita Teamでのみ有効) */
  coediting: boolean;
  /** Qiita Teamのグループ */
  group: QiitaGroupApiResponse;
  /** 閲覧数 */
  page_views_count?: number;
  /** Qiita Team のチームメンバー情報 */
  team_membership: QiitaTeamMembershipApiResponse;
  /** 記事のOrganization の url_name */
  organization_url_name?: string;
  /** スライドモードが有効を表すフラグ */
  slide: boolean;
  /** 記事の要約 */
  summary?: string;

  constructor(response: IQiitaPostApiResponse) {
    this.id = response.id;
    this.title = response.title;
    this.rendered_body = response.rendered_body;
    this.body = response.body;
    this.url = response.url;
    this.created_at = response.created_at;
    this.updated_at = response.updated_at;
    this.user = response.user;
    this.comments_count = response.comments_count;
    this.likes_count = response.likes_count;
    this.reactions_count = response.reactions_count;
    this.stocks_count = response.stocks_count;
    this.private = response.private;
    this.tags = response.tags;
    this.coediting = response.coediting;
    this.group = response.group;
    this.page_views_count = response.page_views_count;
    this.team_membership = response.team_membership;
    this.organization_url_name = response.organization_url_name;
    this.slide = response.slide;
  }
}

/** Qiita API からのレスポンスデータ */
export interface FindQiitaPostApiResponseData {
  /** 最大ページ数 */
  maxPage: number;
  /** API 残り回数 */
  rateRemaining: number;
  /** API リセット時間 */
  rateReset: number;
  /** ページ内の記事一覧 */
  posts: QiitaPostApiResponse[];
}
