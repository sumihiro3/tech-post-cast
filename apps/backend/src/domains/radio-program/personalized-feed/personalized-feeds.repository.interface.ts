import { AppUser, PersonalizedFeedProgram, QiitaPost } from '@prisma/client';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
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
    user: AppUser,
    feed: PersonalizedFeedWithFilters,
    programDate: Date,
    posts: QiitaPost[],
    generateResult: PersonalizedProgramAudioGenerateResult,
    uploadResult: ProgramUploadResult,
  ): Promise<PersonalizedFeedProgram>;
}
