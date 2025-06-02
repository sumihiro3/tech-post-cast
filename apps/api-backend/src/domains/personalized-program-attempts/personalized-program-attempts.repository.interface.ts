import { PersonalizedProgramAttempt } from '@prisma/client';

/**
 * ページネーションオプション
 */
export interface PaginationOptions {
  /** 取得する件数の上限 */
  limit: number;
  /** 取得開始位置のオフセット */
  offset: number;
  /** ソート順の指定（フィールド名: 昇順/降順） */
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
}

/**
 * パーソナライズ番組生成試行履歴一覧の取得結果
 */
export interface PersonalizedProgramAttemptsResult {
  /** 取得された番組生成試行履歴の配列 */
  attempts: PersonalizedProgramAttempt[];
  /** 条件に一致する試行履歴の総件数 */
  totalCount: number;
}

/**
 * ダッシュボード用の拡張された試行履歴データ
 */
export interface PersonalizedProgramAttemptWithRelations {
  /** 試行履歴の一意なID */
  id: string;
  /** 試行を実行したユーザーのID */
  userId: string;
  /** 番組生成の実行ステータス（SUCCESS: 成功, SKIPPED: スキップ, FAILED: 失敗） */
  status: string;
  /** 失敗・スキップの理由（成功時はnull） */
  reason: string | null;
  /** 番組生成に使用された記事の数 */
  postCount: number;
  /** 試行が実行された日時 */
  createdAt: Date;
  /** 対象となったパーソナライズフィードの情報 */
  feed: {
    /** フィードの一意なID */
    id: string;
    /** フィードの表示名 */
    name: string;
  };
  /** 生成された番組の情報（生成に失敗した場合はnull） */
  program: {
    /** 番組の一意なID */
    id: string;
    /** 番組のタイトル */
    title: string;
    /** 番組の有効期限日時（設定されていない場合はnull） */
    expiresAt: Date | null;
    /** 番組の有効期限切れフラグ */
    isExpired: boolean;
  } | null;
}

export interface PersonalizedProgramAttemptsWithRelationsResult {
  /** 取得された関連データ付き番組生成試行履歴の配列 */
  attempts: PersonalizedProgramAttemptWithRelations[];
  /** 条件に一致する試行履歴の総件数 */
  totalCount: number;
}

/**
 * パーソナライズ番組生成試行履歴リポジトリのインターフェース
 */
export interface IPersonalizedProgramAttemptsRepository {
  /**
   * 指定フィードIDの番組生成試行履歴一覧をページネーション付きで取得する
   * @param feedId フィードID
   * @param options ページネーションオプション
   * @returns 番組生成試行履歴一覧と総件数
   */
  findByFeedIdWithPagination(
    feedId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsResult>;

  /**
   * 指定フィードIDの番組生成試行履歴の総件数を取得する
   * @param feedId フィードID
   * @returns 総件数
   */
  countByFeedId(feedId: string): Promise<number>;

  /**
   * 指定ユーザーIDの番組生成試行履歴一覧をページネーション付きで取得する
   * @param userId ユーザーID
   * @param options ページネーションオプション
   * @returns 番組生成試行履歴一覧と総件数
   */
  findByUserIdWithPagination(
    userId: string,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsResult>;

  /**
   * 指定IDの番組生成試行履歴を取得する
   * @param id 試行履歴ID
   * @returns 番組生成試行履歴、存在しない場合はnull
   */
  findById(id: string): Promise<PersonalizedProgramAttempt | null>;

  /**
   * ダッシュボード用：指定ユーザーIDの番組生成試行履歴一覧を関連データ付きで取得する
   * @param userId ユーザーID
   * @param feedId フィードID（オプション、指定した場合はそのフィードのみ）
   * @param options ページネーションオプション
   * @returns 関連データ付きの番組生成試行履歴一覧と総件数
   */
  findByUserIdWithRelationsForDashboard(
    userId: string,
    feedId: string | undefined,
    options: PaginationOptions,
  ): Promise<PersonalizedProgramAttemptsWithRelationsResult>;
}
