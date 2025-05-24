import {
  AppUser,
  PersonalizedFeed,
  PersonalizedFeedProgram,
  PersonalizedProgramAttempt,
  QiitaPost,
} from '@prisma/client';
import {
  PersonalizedFeedWithFilters,
  PersonalizedProgramAttemptFailureReason,
  UserWithSubscription,
} from '@tech-post-cast/database';
import {
  PersonalizedProgramAudioGenerateResult,
  ProgramUploadResult,
} from '../personalized-feed';

/**
 * パーソナルフィードのリポジトリインターフェイス
 */
export interface IPersonalizedFeedsRepository {
  /**
   * 指定 ID のパーソナルフィードを取得する
   * @param id パーソナルフィード ID
   * @returns パーソナルフィード
   */
  findOne(id: string): Promise<PersonalizedFeedWithFilters>;

  /**
   * 指定ユーザーのアクティブなパーソナルフィード一覧を取得する
   * @param user ユーザー
   * @returns アクティブなパーソナルフィード一覧
   */
  findActiveByUser(user: AppUser): Promise<PersonalizedFeedWithFilters[]>;

  /**
   * アクティブなパーソナルフィード一覧を取得する
   * @returns アクティブなパーソナルフィード一覧
   */
  findActive(): Promise<PersonalizedFeedWithFilters[]>;

  /**
   * パーソナルフィードの件数を取得する
   * @returns パーソナルフィードの件数
   */
  count(): Promise<number>;

  /**
   * パーソナルフィード一覧を取得する
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns パーソナルフィード一覧
   */
  find(page: number, limit: number): Promise<PersonalizedFeedWithFilters[]>;

  /**
   * パーソナライズプログラムを作成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param posts 記事一覧
   * @param generateResult 番組生成結果
   * @param uploadResult アップロード結果
   * @returns 作成されたパーソナライズプログラム
   */
  createPersonalizedProgram(
    user: UserWithSubscription,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    posts: QiitaPost[],
    generateResult: PersonalizedProgramAudioGenerateResult,
    uploadResult: ProgramUploadResult,
  ): Promise<PersonalizedFeedProgram>;

  /**
   * 指定フィードで、指定日に生成された番組があるかどうかを確認する
   * @param feedId パーソナルフィードID
   * @param programDate 番組日
   * @returns 番組があるかどうか
   */
  findProgramByFeedIdAndDate(
    feed: PersonalizedFeed,
    programDate: Date,
  ): Promise<boolean>;

  /**
   * 有効期限が過ぎたパーソナルプログラムを無効化する
   */
  invalidateExpiredPrograms(): Promise<void>;

  /**
   * パーソナライズフィードを元に生成された番組の成功の試行履歴を作成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param postCount 紹介記事数
   * @param programId 番組ID
   */
  addPersonalizedProgramSuccessAttempt(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    postCount: number,
    programId: string,
  ): Promise<PersonalizedProgramAttempt>;

  /**
   * パーソナライズフィードを元に生成された番組の失敗の試行履歴を作成する
   * @param user ユーザー
   * @param feed パーソナルフィード
   * @param programDate 番組日
   * @param postCount 紹介記事数
   * @param reason 失敗理由
   * @returns 試行履歴
   */
  addPersonalizedProgramFailureAttempt(
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    postCount: number,
    reason: PersonalizedProgramAttemptFailureReason,
  ): Promise<PersonalizedProgramAttempt>;
}
