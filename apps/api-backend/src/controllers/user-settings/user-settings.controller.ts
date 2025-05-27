import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import { UserSettingsService } from '@/domains/user-settings/user-settings.service';
import {
  SlackWebhookTestError,
  UserNotFoundError,
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  GetUserSettingsResponseDto,
  TestSlackWebhookRequestDto,
  TestSlackWebhookResponseDto,
  UpdateUserSettingsRequestDto,
} from './dto';

/**
 * ユーザー設定コントローラー
 * ユーザー設定の取得・更新・Slack通知テストなどのエンドポイントを提供
 */
@ApiTags('user-settings')
@Controller('user-settings')
@UseGuards(ClerkJwtGuard)
@ApiBearerAuth()
export class UserSettingsController {
  private readonly logger = new Logger(UserSettingsController.name);

  constructor(
    private readonly userSettingsService: UserSettingsService,
    @Inject('AppUserRepository')
    private readonly appUserRepository: IAppUsersRepository,
  ) {}

  /**
   * 認証ユーザーのユーザー設定を取得する
   */
  @Get()
  @ApiOperation({
    summary: 'ユーザー設定取得',
    description:
      '認証ユーザーのユーザー設定（表示名、Slack通知設定など）を取得します。',
  })
  @ApiOkResponse({
    description: 'ユーザー設定の取得に成功',
    type: GetUserSettingsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '認証が必要です',
  })
  @ApiNotFoundResponse({
    description: 'ユーザーが見つかりません',
  })
  @ApiInternalServerErrorResponse({
    description: 'サーバー内部エラー',
  })
  async getUserSettings(
    @CurrentUserId() userId: string,
  ): Promise<GetUserSettingsResponseDto> {
    this.logger.debug('UserSettingsController.getUserSettings called', {
      userId,
    });

    try {
      // ユーザー情報を取得
      const appUser = await this.appUserRepository.findOne(userId);
      if (!appUser) {
        throw new UserNotFoundError(`ユーザー [${userId}] が見つかりません`);
      }

      // ユーザー設定を取得
      const userSettings =
        await this.userSettingsService.getUserSettings(appUser);

      const response: GetUserSettingsResponseDto = {
        userId: userSettings.userId,
        displayName: userSettings.displayName,
        slackWebhookUrl: userSettings.slackWebhookUrl,
        notificationEnabled: userSettings.notificationEnabled,
        updatedAt: userSettings.updatedAt,
      };

      this.logger.log('ユーザー設定を取得しました', {
        userId,
        notificationEnabled: userSettings.notificationEnabled,
        hasSlackWebhook: !!userSettings.slackWebhookUrl,
      });

      return response;
    } catch (error) {
      if (
        error instanceof UserNotFoundError ||
        error instanceof UserSettingsNotFoundError
      ) {
        this.logger.warn('ユーザーまたはユーザー設定が見つかりません', {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      }

      if (error instanceof UserSettingsRetrievalError) {
        this.logger.error('ユーザー設定の取得に失敗しました', {
          userId,
          error: error.message,
        });
        throw new InternalServerErrorException(
          'ユーザー設定の取得に失敗しました',
        );
      }

      this.logger.error('予期しないエラーが発生しました', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('予期しないエラーが発生しました');
    }
  }

  /**
   * 認証ユーザーのユーザー設定を更新する
   */
  @Patch()
  @ApiOperation({
    summary: 'ユーザー設定更新',
    description:
      '認証ユーザーのユーザー設定（表示名、Slack通知設定など）を更新します。',
  })
  @ApiOkResponse({
    description: 'ユーザー設定の更新に成功',
    type: GetUserSettingsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'リクエストパラメータが不正です',
  })
  @ApiUnauthorizedResponse({
    description: '認証が必要です',
  })
  @ApiNotFoundResponse({
    description: 'ユーザーが見つかりません',
  })
  @ApiInternalServerErrorResponse({
    description: 'サーバー内部エラー',
  })
  async updateUserSettings(
    @CurrentUserId() userId: string,
    @Body() updateDto: UpdateUserSettingsRequestDto,
  ): Promise<GetUserSettingsResponseDto> {
    this.logger.debug('UserSettingsController.updateUserSettings called', {
      userId,
      params: {
        displayName: updateDto.displayName,
        notificationEnabled: updateDto.notificationEnabled,
        hasSlackWebhook: !!updateDto.slackWebhookUrl,
      },
    });

    try {
      // ユーザー情報を取得
      const appUser = await this.appUserRepository.findOne(userId);
      if (!appUser) {
        throw new UserNotFoundError(`ユーザー [${userId}] が見つかりません`);
      }

      // ユーザー設定を更新
      const updatedSettings = await this.userSettingsService.updateUserSettings(
        appUser,
        updateDto,
      );

      const response: GetUserSettingsResponseDto = {
        userId: updatedSettings.userId,
        displayName: updatedSettings.displayName,
        slackWebhookUrl: updatedSettings.slackWebhookUrl,
        notificationEnabled: updatedSettings.notificationEnabled,
        updatedAt: updatedSettings.updatedAt,
      };

      this.logger.log('ユーザー設定を更新しました', {
        userId,
        notificationEnabled: updatedSettings.notificationEnabled,
        hasSlackWebhook: !!updatedSettings.slackWebhookUrl,
      });

      return response;
    } catch (error) {
      if (
        error instanceof UserNotFoundError ||
        error instanceof UserSettingsNotFoundError
      ) {
        this.logger.warn('ユーザーまたはユーザー設定が見つかりません', {
          userId,
          error: error.message,
        });
        throw new NotFoundException(error.message);
      }

      if (error instanceof UserSettingsUpdateError) {
        // バリデーションエラーの場合はBadRequestExceptionとして扱う
        if (
          error.message.includes('無効な') ||
          error.message.includes('形式')
        ) {
          this.logger.warn(
            'ユーザー設定の更新でバリデーションエラーが発生しました',
            {
              userId,
              error: error.message,
            },
          );
          throw new BadRequestException(error.message);
        }

        this.logger.error('ユーザー設定の更新に失敗しました', {
          userId,
          error: error.message,
        });
        throw new InternalServerErrorException(
          'ユーザー設定の更新に失敗しました',
        );
      }

      this.logger.error('予期しないエラーが発生しました', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new InternalServerErrorException('予期しないエラーが発生しました');
    }
  }

  /**
   * Slack Webhook URLの接続テストを実行する
   */
  @Post('test-slack-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Slack Webhook URLテスト',
    description:
      '指定されたSlack Webhook URLに対してテスト通知を送信し、接続を確認します。',
  })
  @ApiOkResponse({
    description: 'Slack Webhook URLテストの実行に成功',
    type: TestSlackWebhookResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'リクエストパラメータが不正です',
  })
  @ApiUnauthorizedResponse({
    description: '認証が必要です',
  })
  @ApiInternalServerErrorResponse({
    description: 'サーバー内部エラー',
  })
  async testSlackWebhook(
    @CurrentUserId() userId: string,
    @Body() testDto: TestSlackWebhookRequestDto,
  ): Promise<TestSlackWebhookResponseDto> {
    this.logger.debug('UserSettingsController.testSlackWebhook called', {
      userId,
      webhookUrl: this.maskWebhookUrl(testDto.webhookUrl),
    });

    try {
      const testResult = await this.userSettingsService.testSlackWebhook(
        testDto.webhookUrl,
      );

      this.logger.log('Slack Webhook URLテストを実行しました', {
        userId,
        success: testResult.success,
        responseTime: testResult.responseTime,
        webhookUrl: this.maskWebhookUrl(testDto.webhookUrl),
      });

      return testResult;
    } catch (error) {
      if (error instanceof SlackWebhookTestError) {
        // テストエラーの場合は、結果として返す（例外として扱わない）
        const testResult: TestSlackWebhookResponseDto = {
          success: false,
          errorMessage: error.message,
          responseTime: 0,
        };

        this.logger.warn('Slack Webhook URLテストが失敗しました', {
          userId,
          error: error.message,
          webhookUrl: this.maskWebhookUrl(testDto.webhookUrl),
        });

        return testResult;
      }

      this.logger.error(
        'Slack Webhook URLテストで予期しないエラーが発生しました',
        {
          userId,
          error: error.message,
          stack: error.stack,
          webhookUrl: this.maskWebhookUrl(testDto.webhookUrl),
        },
      );
      throw new InternalServerErrorException(
        'Slack Webhook URLテストでエラーが発生しました',
      );
    }
  }

  /**
   * ログ出力用にWebhook URLをマスクする
   * @param webhookUrl マスクするWebhook URL
   * @returns マスクされたWebhook URL
   */
  private maskWebhookUrl(webhookUrl: string): string {
    if (!webhookUrl) return '';

    // URLの最後の部分（トークン）をマスク
    const parts = webhookUrl.split('/');
    if (parts.length >= 3) {
      parts[parts.length - 1] = '***';
    }
    return parts.join('/');
  }
}
