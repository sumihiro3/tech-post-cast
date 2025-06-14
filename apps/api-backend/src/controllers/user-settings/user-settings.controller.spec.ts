import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import { UserSettingsService } from '@/domains/user-settings/user-settings.service';
import { AppUserFactory, UserSettingsFactory } from '@/test/factories';
import {
  setupLogSuppression,
  teardownLogSuppression,
} from '@/test/helpers/logger.helper';
import {
  RssTokenRegenerationError,
  SlackWebhookTestError,
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestSlackWebhookRequestDto,
  UpdateUserSettingsRequestDto,
} from './dto';
import { UserSettingsController } from './user-settings.controller';

describe('UserSettingsController', () => {
  let controller: UserSettingsController;
  let mockUserSettingsService: jest.Mocked<UserSettingsService>;
  let mockAppUsersRepository: jest.Mocked<IAppUsersRepository>;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = setupLogSuppression();

    // サービスのモック作成
    mockUserSettingsService = {
      getUserSettings: jest.fn(),
      updateUserSettings: jest.fn(),
      updateRssSettings: jest.fn(),
      regenerateRssToken: jest.fn(),
      getRssUrl: jest.fn(),
      testSlackWebhook: jest.fn(),
    } as any;

    mockAppUsersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOneWithSubscription: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [
        {
          provide: UserSettingsService,
          useValue: mockUserSettingsService,
        },
        {
          provide: 'AppUserRepository',
          useValue: mockAppUsersRepository,
        },
      ],
    })
      .overrideGuard(require('@/auth/guards/clerk-jwt.guard').ClerkJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserSettingsController>(UserSettingsController);
  });

  afterEach(() => {
    teardownLogSuppression(logSpies);
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('正常にユーザー設定を取得できること', async () => {
      // Arrange
      const userId = 'user-1';
      const appUser = AppUserFactory.createUserWithSlackNotification({
        id: userId,
      });
      const userSettings = UserSettingsFactory.createUserSettingsWithSlack({
        userId: appUser.id,
        displayName: appUser.displayName,
      });
      const rssUrl = 'https://rss.techpostcast.com/u/test-token/rss.xml';

      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.getUserSettings.mockResolvedValue(userSettings);
      mockUserSettingsService.getRssUrl.mockReturnValue(rssUrl);

      // Act
      const result = await controller.getUserSettings(userId);

      // Assert
      expect(result.userId).toBe(userSettings.userId);
      expect(result.displayName).toBe(userSettings.displayName);
      expect(result.slackWebhookUrl).toBe(userSettings.slackWebhookUrl);
      expect(result.notificationEnabled).toBe(userSettings.notificationEnabled);
      expect(result.rssEnabled).toBe(appUser.rssEnabled);
      expect(result.rssToken).toBe(
        appUser.rssEnabled ? appUser.rssToken : undefined,
      );
      expect(result.rssUrl).toBe(rssUrl);
      expect(result.updatedAt).toBe(userSettings.updatedAt);
      expect(mockAppUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(
        appUser,
      );
      expect(mockUserSettingsService.getRssUrl).toHaveBeenCalledWith(appUser);
    });

    it('ユーザーが見つからない場合、NotFoundExceptionが発生すること', async () => {
      // Arrange
      const userId = 'user-1';
      mockAppUsersRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getUserSettings(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAppUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserSettingsService.getUserSettings).not.toHaveBeenCalled();
    });

    it('ユーザー設定が見つからない場合、NotFoundExceptionが発生すること', async () => {
      // Arrange
      const userId = 'user-1';
      const appUser = AppUserFactory.createAppUser({ id: userId });
      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.getUserSettings.mockRejectedValue(
        new UserSettingsNotFoundError('ユーザー設定が見つかりません'),
      );

      // Act & Assert
      await expect(controller.getUserSettings(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAppUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(
        appUser,
      );
    });

    it('データベースエラーの場合、InternalServerErrorExceptionが発生すること', async () => {
      // Arrange
      const userId = 'user-1';
      const appUser = AppUserFactory.createAppUser({ id: userId });
      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.getUserSettings.mockRejectedValue(
        new UserSettingsRetrievalError('データベースエラー'),
      );

      // Act & Assert
      await expect(controller.getUserSettings(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockAppUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserSettingsService.getUserSettings).toHaveBeenCalledWith(
        appUser,
      );
    });
  });

  describe('updateUserSettings', () => {
    it('正常にユーザー設定を更新できること', async () => {
      // Arrange
      const userId = 'user-1';
      const appUser = AppUserFactory.createAppUser({ id: userId });
      const requestDto = new UpdateUserSettingsRequestDto();
      requestDto.displayName = 'Updated User';
      requestDto.slackWebhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      requestDto.notificationEnabled = true;

      const updatedSettings = UserSettingsFactory.createUserSettingsWithSlack({
        userId: appUser.id,
        displayName: requestDto.displayName,
        slackWebhookUrl: requestDto.slackWebhookUrl,
        notificationEnabled: requestDto.notificationEnabled,
        updatedAt: new Date(),
      });

      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.updateUserSettings.mockResolvedValue(
        updatedSettings,
      );
      mockUserSettingsService.getRssUrl.mockReturnValue(undefined);

      // Act
      const result = await controller.updateUserSettings(userId, requestDto);

      // Assert
      expect(result.userId).toBe(updatedSettings.userId);
      expect(result.displayName).toBe(updatedSettings.displayName);
      expect(result.slackWebhookUrl).toBe(updatedSettings.slackWebhookUrl);
      expect(result.notificationEnabled).toBe(
        updatedSettings.notificationEnabled,
      );
      expect(result.rssEnabled).toBe(appUser.rssEnabled);
      expect(result.rssToken).toBe(
        appUser.rssEnabled ? appUser.rssToken : undefined,
      );
      expect(result.rssUrl).toBeUndefined();
      expect(mockAppUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserSettingsService.updateUserSettings).toHaveBeenCalledWith(
        appUser,
        {
          displayName: requestDto.displayName,
          slackWebhookUrl: requestDto.slackWebhookUrl,
          notificationEnabled: requestDto.notificationEnabled,
        },
      );
    });

    it('無効なSlack Webhook URLの場合、BadRequestExceptionが発生すること', async () => {
      // Arrange
      const userId = 'user-1';
      const appUser = AppUserFactory.createAppUser({ id: userId });
      const requestDto = new UpdateUserSettingsRequestDto();
      requestDto.slackWebhookUrl = 'invalid-url';
      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.updateUserSettings.mockRejectedValue(
        new UserSettingsUpdateError('無効なSlack Webhook URL'),
      );

      // Act & Assert
      await expect(
        controller.updateUserSettings(userId, requestDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockAppUsersRepository.findOne).toHaveBeenCalledWith(userId);
      expect(mockUserSettingsService.updateUserSettings).toHaveBeenCalled();
    });

    it('RSS設定を含むユーザー設定を正常に更新できること', async () => {
      // Arrange
      const userId = 'user-1';
      const appUser = AppUserFactory.createUserWithRssDisabled({ id: userId });
      const updatedAppUser = AppUserFactory.createUserWithRssEnabled({
        id: userId,
      });
      const requestDto = new UpdateUserSettingsRequestDto();
      requestDto.displayName = 'Updated User';
      requestDto.rssEnabled = true;

      const updatedSettings = UserSettingsFactory.createUserSettings({
        userId: appUser.id,
        displayName: requestDto.displayName,
        updatedAt: new Date(),
      });
      const rssUrl = 'https://rss.techpostcast.com/u/test-token/rss.xml';

      mockAppUsersRepository.findOne
        .mockResolvedValueOnce(appUser)
        .mockResolvedValueOnce(updatedAppUser);
      mockUserSettingsService.updateUserSettings.mockResolvedValue(
        updatedSettings,
      );
      mockUserSettingsService.updateRssSettings.mockResolvedValue(
        UserSettingsFactory.createUserSettingsWithRssEnabled(),
      );
      mockUserSettingsService.getRssUrl.mockReturnValue(rssUrl);

      // Act
      const result = await controller.updateUserSettings(userId, requestDto);

      // Assert
      expect(result.rssEnabled).toBe(true);
      expect(result.rssToken).toBe(updatedAppUser.rssToken);
      expect(result.rssUrl).toBe(rssUrl);
      expect(mockUserSettingsService.updateRssSettings).toHaveBeenCalledWith(
        appUser,
        { rssEnabled: true },
      );
    });
  });

  describe('testSlackWebhook', () => {
    it('正常にSlack Webhook URLをテストできること', async () => {
      // Arrange
      const requestDto = new TestSlackWebhookRequestDto();
      requestDto.webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      const testResult = {
        success: true,
        responseTime: 150,
      };
      mockUserSettingsService.testSlackWebhook.mockResolvedValue(testResult);

      // Act
      const result = await controller.testSlackWebhook('user-1', requestDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.responseTime).toBe(150);
      expect(result.errorMessage).toBeUndefined();
      expect(mockUserSettingsService.testSlackWebhook).toHaveBeenCalledWith(
        requestDto.webhookUrl,
      );
    });

    it('Slack Webhook URLテストが失敗した場合、失敗結果を返すこと', async () => {
      // Arrange
      const requestDto = new TestSlackWebhookRequestDto();
      requestDto.webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      mockUserSettingsService.testSlackWebhook.mockRejectedValue(
        new SlackWebhookTestError('Webhook URLが無効です'),
      );

      // Act
      const result = await controller.testSlackWebhook('user-1', requestDto);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Webhook URLが無効です');
      expect(result.responseTime).toBe(0);
      expect(mockUserSettingsService.testSlackWebhook).toHaveBeenCalledWith(
        requestDto.webhookUrl,
      );
    });
  });

  describe('regenerateRssToken', () => {
    const userId = 'test-user-id';

    it('RSSトークンを正常に再生成できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const regenerationResult = {
        rssToken: 'new-rss-token',
        rssUrl: 'https://rss.techpostcast.com/u/new-rss-token/rss.xml',
        rssCreatedAt: new Date(),
      };

      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.regenerateRssToken.mockResolvedValue(
        regenerationResult,
      );

      // Act
      const result = await controller.regenerateRssToken(userId);

      // Assert
      expect(result).toEqual({
        rssToken: regenerationResult.rssToken,
        rssUrl: regenerationResult.rssUrl,
        updatedAt: regenerationResult.rssCreatedAt,
      });

      expect(mockUserSettingsService.regenerateRssToken).toHaveBeenCalledWith(
        appUser,
      );
    });

    it('RSS機能が無効な場合、BadRequestExceptionがスローされること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssDisabled();
      mockAppUsersRepository.findOne.mockResolvedValue(appUser);

      // Act & Assert
      await expect(controller.regenerateRssToken(userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserSettingsService.regenerateRssToken).not.toHaveBeenCalled();
    });

    it('ユーザーが見つからない場合、NotFoundExceptionがスローされること', async () => {
      // Arrange
      mockAppUsersRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.regenerateRssToken(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('RssTokenRegenerationErrorの場合、InternalServerErrorExceptionがスローされること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      mockAppUsersRepository.findOne.mockResolvedValue(appUser);
      mockUserSettingsService.regenerateRssToken.mockRejectedValue(
        new RssTokenRegenerationError('再生成エラー'),
      );

      // Act & Assert
      await expect(controller.regenerateRssToken(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
