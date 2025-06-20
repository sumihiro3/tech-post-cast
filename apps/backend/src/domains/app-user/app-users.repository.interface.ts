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

  /**
   * RSS機能が有効なユーザー一覧を取得する
   * @returns RSS機能が有効なユーザー一覧
   */
  findRssEnabledUsers(): Promise<AppUser[]>;

  /**
   * ユーザーの RSS 配信時間を更新する
   * @param userId 更新するユーザーID
   */
  updateRssDeliveryTime(userId: string): Promise<void>;
}
