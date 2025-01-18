import { HeadlineTopicProgram, QiitaPost } from '@prisma/client';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { HeadlineTopicProgramGenerateResult, ProgramUploadResult } from '.';

/**
 * ヘッドライントピック番組のリポジトリインターフェース
 */
export interface IHeadlineTopicProgramsRepository {
  /**
   * 指定 ID のヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組
   */
  findOne(id: string): Promise<HeadlineTopicProgramWithQiitaPosts>;

  /**
   * ヘッドライントピック番組の件数を取得する
   * @returns ヘッドライントピック番組の件数
   */
  count(): Promise<number>;

  /**
   * ヘッドライントピック番組を取得する
   * @param page ページ番号
   * @param limit 1 ページあたりの件数
   * @returns ヘッドライントピック番組一覧
   */
  find(
    page: number,
    limit: number,
  ): Promise<HeadlineTopicProgramWithQiitaPosts[]>;

  /**
   * ヘッドライントピック番組のID一覧を取得する
   * @returns ヘッドライントピック番組のID一覧
   */
  findIds(): Promise<string[]>;

  /**
   * ヘッドライントピック番組を新規登録する
   * @param programDate 番組日時
   * @param posts 番組での紹介記事 ID 一覧
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   * @returns 登録したヘッドライントピック番組
   */
  createHeadlineTopicProgram(
    programDate: Date,
    posts: QiitaPost[],
    programGenerateResult: HeadlineTopicProgramGenerateResult,
    programUploadResult: ProgramUploadResult,
  ): Promise<HeadlineTopicProgram>;

  /**
   * ヘッドライントピック番組を更新する
   * @param id 番組 ID
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   * @returns 更新したヘッドライントピック番組
   */
  updateHeadlineTopicProgram(
    id: string,
    programGenerateResult: HeadlineTopicProgramGenerateResult,
    programUploadResult: ProgramUploadResult,
  ): Promise<HeadlineTopicProgram>;
}
