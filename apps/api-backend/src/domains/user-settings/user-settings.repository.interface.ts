import { AppUser } from '@prisma/client';
import { UpdateUserSettingsParams, UserSettings } from './user-settings.entity';

/**
 * ユーザー設定リポジトリのインターフェース
 * 依存性逆転の原則に基づき、ドメイン層でインターフェースを定義
 */
export interface IUserSettingsRepository {
  /**
   * 指定ユーザーのユーザー設定を取得する
   * @param appUser 取得するユーザー
   * @returns ユーザー設定情報
   * @throws UserSettingsNotFoundError ユーザーが存在しない場合
   * @throws UserSettingsRetrievalError 取得処理でエラーが発生した場合
   */
  findByAppUser(appUser: AppUser): Promise<UserSettings>;

  /**
   * 指定ユーザーのユーザー設定を更新する
   * @param appUser 更新するユーザー
   * @param params 更新パラメータ
   * @returns 更新されたユーザー設定情報
   * @throws UserSettingsNotFoundError ユーザーが存在しない場合
   * @throws UserSettingsUpdateError 更新処理でエラーが発生した場合
   */
  updateByAppUser(
    appUser: AppUser,
    params: UpdateUserSettingsParams,
  ): Promise<UserSettings>;
}
