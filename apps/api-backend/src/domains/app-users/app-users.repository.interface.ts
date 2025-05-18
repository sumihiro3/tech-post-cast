import { AppUser } from '@prisma/client';
import { UserWithSubscriptionResult } from '@tech-post-cast/database';

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
   * 新規ユーザーを作成する
   * @param appUser 新規ユーザー
   * @returns 作成されたユーザー
   */
  create(appUser: AppUser): Promise<AppUser>;

  /**
   * ユーザーを更新する
   * @param appUser 更新するユーザー
   * @returns 更新されたユーザー
   */
  update(appUser: AppUser): Promise<AppUser>;

  /**
   * ユーザーを削除する
   * @param userId 削除するユーザーID
   */
  delete(userId: string): Promise<void>;

  /**
   * サブスクリプション情報を含めたユーザー情報を取得する
   * @param userId - ユーザーID
   * @returns ユーザー情報とサブスクリプション情報
   */
  findOneWithSubscription(userId: string): Promise<UserWithSubscriptionResult>;
}
