import { HeadlineTopicProgram, QiitaPost } from '@prisma/client';
import { HeadlineTopicProgramGenerateResult } from '.';

/**
 * ヘッドライントピック番組のリポジトリインターフェース
 */
export interface IHeadlineTopicProgramsRepository {
  /**
   * 指定 ID のヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組
   */
  findOne(id: string): Promise<HeadlineTopicProgram>;

  /**
   * ヘッドライントピック番組を新規登録または更新する
   * @param programDate 番組日時
   * @param posts 番組での紹介記事 ID 一覧
   * @param audioFileGenerateResult 番組音声ファイルの生成結果
   * @param audioFileUrl 番組音声ファイルの URL
   * @returns 登録したヘッドライントピック番組
   */
  upsertHeadlineTopicProgram(
    programDate: Date,
    posts: QiitaPost[],
    audioFileGenerateResult: HeadlineTopicProgramGenerateResult,
    audioFileUrl: string,
  ): Promise<HeadlineTopicProgram>;
}
