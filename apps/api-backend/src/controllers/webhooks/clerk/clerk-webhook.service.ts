import {
  AppUserCreateError,
  AppUserDeleteError,
  AppUserUpdateError,
} from '@/types/errors';
import { UserJSON, WebhookEvent } from '@clerk/backend';
import { IAppUsersRepository } from '@domains/app-users/app-users.repository.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(
    @Inject('AppUserRepository')
    private readonly appUserRepository: IAppUsersRepository,
  ) {}

  /**
   * ClerkのWebhookを受け取る
   * @param headers リクエストヘッダー
   * @param webhook WebhookEvent
   */
  async handleWebhook(
    headers: Record<string, string>,
    webhook: WebhookEvent,
  ): Promise<void> {
    this.logger.debug('ClerkWebhookService.handleWebhook called', {
      headers,
      webhook,
    });
    // イベント種別
    const eventType = webhook.type;
    switch (eventType) {
      case 'user.created':
        // ユーザー作成時の処理
        await this.handleUserCreated(webhook.data);
        break;
      case 'user.updated':
        // ユーザー更新時の処理
        await this.handleUserUpdated(webhook.data);
        break;
      case 'user.deleted':
        // ユーザー削除時の処理
        await this.handleUserDeleted(webhook.data.id);
        break;
      default:
        this.logger.warn(`未対応のイベント種別 [${eventType}] を受信しました`);
        break;
    }
  }

  /**
   * ユーザー登録時の処理
   * @param userJson UserJSON
   */
  async handleUserCreated(userJson: UserJSON): Promise<void> {
    this.logger.debug('ClerkWebhookService.handleUserCreated called', {
      userJson,
    });
    // ユーザー登録時の処理
    try {
      const appUser = await this.appUserRepository.create({
        id: userJson.id,
        email: userJson.email_addresses[0].email_address,
        firstName: userJson.first_name,
        lastName: userJson.last_name,
        displayName: `${userJson.first_name} ${userJson.last_name}`,
        imageUrl: userJson.image_url,
        isActive: true,
        lastSignInAt: new Date(userJson.last_sign_in_at),
        stripeCustomerId: undefined,
        defaultPaymentMethodId: undefined,
        createdAt: new Date(userJson.created_at),
        updatedAt: new Date(userJson.updated_at),
      });
      this.logger.log(`新規ユーザー [${appUser.id}] を登録しました`);
    } catch (error) {
      const errorMessage = `ユーザーの新規登録に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        webhook: userJson,
      });
      throw new AppUserCreateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザー更新時の処理
   * @param userJson UserJSON
   */
  async handleUserUpdated(userJson: UserJSON): Promise<void> {
    this.logger.debug('ClerkWebhookService.handleUserUpdated called', {
      userJson,
    });
    // ユーザー更新時の処理
    try {
      const appUser = await this.appUserRepository.findOne(userJson.id);
      if (!appUser) {
        this.logger.warn(`ユーザー [${userJson.id}] が見つかりません`);
        return;
      }
      const updatedUser = await this.appUserRepository.update({
        id: userJson.id,
        email: userJson.email_addresses[0].email_address,
        firstName: userJson.first_name,
        lastName: userJson.last_name,
        displayName: `${userJson.first_name} ${userJson.last_name}`,
        imageUrl: userJson.image_url,
        isActive: true,
        lastSignInAt: new Date(userJson.last_sign_in_at),
        stripeCustomerId: appUser.stripeCustomerId,
        defaultPaymentMethodId: appUser.defaultPaymentMethodId,
        createdAt: new Date(userJson.created_at),
        updatedAt: new Date(userJson.updated_at),
      });
      this.logger.log(`ユーザー [${appUser.id}] を更新しました`);
    } catch (error) {
      const errorMessage = `ユーザーの更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        webhook: userJson,
      });
      throw new AppUserUpdateError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ユーザー削除時の処理
   * @param userId UserID
   */
  async handleUserDeleted(userId: string): Promise<void> {
    this.logger.debug('ClerkWebhookService.handleUserDeleted called', {
      userId,
    });
    if (!userId) {
      this.logger.warn('ユーザーIDが指定されていません');
      return;
    }
    // ユーザー削除時の処理
    try {
      const user = await this.appUserRepository.findOne(userId);
      if (!user) {
        this.logger.warn(
          `ユーザー [${userId}] は登録されていません。削除処理はスキップします。`,
        );
        return;
      }
      await this.appUserRepository.delete(userId);
      this.logger.log(`ユーザー [${userId}] を削除しました`);
    } catch (error) {
      const errorMessage = `ユーザーの削除に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        webhook: userId,
      });
      throw new AppUserDeleteError(errorMessage, {
        cause: error,
      });
    }
  }
}
