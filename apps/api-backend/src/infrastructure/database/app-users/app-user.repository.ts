import {
  AppUserCreateError,
  AppUserDeleteError,
  AppUserFindError,
  AppUserUpdateError,
} from '@/types/errors';
import { IAppUserRepository } from '@domains/app-user/app-user.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import { PrismaClientManager } from '@tech-post-cast/database';

/**
 * IAppUserRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class AppUserRepository implements IAppUserRepository {
  private readonly logger = new Logger(AppUserRepository.name);

  constructor(private readonly prisma: PrismaClientManager) {}

  /**
   * 指定IDのユーザーを取得する
   * @param userId 取得するユーザーID
   * @returns 取得されたユーザー
   */
  async findOne(userId: string): Promise<AppUser> {
    this.logger.debug('AppUserRepository.findOne called', { userId });
    try {
      const client = this.prisma.getClient();
      const result = await client.appUser.findUnique({
        where: { id: userId },
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザーの取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
      });
      throw new AppUserFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 新規ユーザーを作成する
   * @param appUser 新規ユーザー
   * @returns 作成されたユーザー
   */
  async create(appUser: AppUser): Promise<AppUser> {
    this.logger.debug('AppUserRepository.create called', { appUser });
    try {
      const client = this.prisma.getClient();
      // Upsert を利用して、ユーザーが存在しない場合は新規作成、存在する場合は更新する
      const result = await client.appUser.upsert({
        where: { id: appUser.id },
        update: appUser,
        create: appUser,
      });
      this.logger.log(`ユーザー [${result.id}] を新規登録または更新しました`, {
        appUser: result,
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザーの新規登録または更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        appUser,
      });
      throw new AppUserCreateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザーを更新する
   * @param appUser 更新するユーザー
   * @returns 更新されたユーザー
   */
  async update(appUser: AppUser): Promise<AppUser> {
    this.logger.debug('AppUserRepository.update called', { appUser });
    try {
      const client = this.prisma.getClient();
      // 更新対象ユーザーが存在するか確認する
      const user = await this.findOne(appUser.id);
      if (!user) {
        const errorMessage = `更新対象ユーザー [${appUser.id}] は登録されていません`;
        throw new AppUserUpdateError(errorMessage);
      }
      // ユーザーを更新する
      const result = await client.appUser.update({
        where: { id: appUser.id },
        data: appUser,
      });
      this.logger.log(`ユーザー [${result.id}] を更新しました`, {
        appUser: result,
      });
      return result;
    } catch (error) {
      const errorMessage = `ユーザーの更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        appUser,
      });
      throw new AppUserUpdateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザーを削除する
   * @param userId 削除するユーザーID
   */
  async delete(userId: string): Promise<void> {
    this.logger.debug('AppUserRepository.delete called', { userId });
    try {
      const client = this.prisma.getClient();
      // 削除対象ユーザーが存在するか確認する
      const user = await this.findOne(userId);
      if (!user) {
        const errorMessage = `削除対象ユーザー [${userId}] は登録されていません`;
        throw new AppUserDeleteError(errorMessage);
      }
      // ユーザーを論理削除する
      await client.appUser.update({
        where: { id: userId },
        data: { isActive: false, updatedAt: new Date() },
      });
      this.logger.log(`ユーザー [${userId}] を論理削除しました`);
    } catch (error) {
      const errorMessage = `ユーザーの論理削除に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        userId,
      });
      throw new AppUserDeleteError(errorMessage, {
        cause: error,
      });
    }
  }
}
