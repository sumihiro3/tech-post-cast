import { AppUser } from '@prisma/client';
import { UserWithSubscription } from '@tech-post-cast/database';

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

  /**
   * サブスクリプション情報を含めたユーザー情報を取得する
   * @param userId - ユーザーID
   * @returns ユーザー情報とサブスクリプション情報
   */
  findOneWithSubscription(userId: string): Promise<UserWithSubscription>;
}
