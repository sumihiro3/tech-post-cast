import { AppUser } from '@prisma/client';

/**
 * アプリケーションユーザーリポジトリのインターフェース
 */
export interface IAppUsersRepository {
  /**
   * 指定IDのユーザーを取得する
   * @param userId 取得するユーザーID
   * @returns 取得されたユーザー
   */
  findOne(userId: string): Promise<AppUser>;
}
