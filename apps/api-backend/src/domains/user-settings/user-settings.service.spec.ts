import { AppUserFactory, UserSettingsFactory } from '@/test/factories';
import {
  SlackWebhookTestError,
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserSettingsParams } from './user-settings.entity';
import { IUserSettingsRepository } from './user-settings.repository.interface';
import { UserSettingsService } from './user-settings.service';

// fetchのモック
global.fetch = jest.fn();

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let mockRepository: jest.Mocked<IUserSettingsRepository>;

  beforeEach(async () => {
    // リポジトリのモック作成
    mockRepository = {
      findByAppUser: jest.fn(),
      updateByAppUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsService,
        {
          provide: 'UserSettingsRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserSettingsService>(UserSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSettings', () => {
    it('正常にユーザー設定を取得できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const expectedSettings = UserSettingsFactory.createUserSettings({
        userId: appUser.id,
        displayName: appUser.displayName,
      });
      mockRepository.findByAppUser.mockResolvedValue(expectedSettings);

      // Act
      const result = await service.getUserSettings(appUser);

      // Assert
      expect(result).toEqual(expectedSettings);
      expect(mockRepository.findByAppUser).toHaveBeenCalledWith(appUser);
    });

    it('ユーザー設定が見つからない場合、UserSettingsNotFoundErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      mockRepository.findByAppUser.mockRejectedValue(
        new UserSettingsNotFoundError('ユーザー設定が見つかりません'),
      );

      // Act & Assert
      await expect(service.getUserSettings(appUser)).rejects.toThrow(
        UserSettingsNotFoundError,
      );
      expect(mockRepository.findByAppUser).toHaveBeenCalledWith(appUser);
    });

    it('データベースエラーが発生した場合、UserSettingsRetrievalErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      mockRepository.findByAppUser.mockRejectedValue(
        new UserSettingsRetrievalError('データベースエラー'),
      );

      // Act & Assert
      await expect(service.getUserSettings(appUser)).rejects.toThrow(
        UserSettingsRetrievalError,
      );
      expect(mockRepository.findByAppUser).toHaveBeenCalledWith(appUser);
    });
  });

  describe('updateUserSettings', () => {
    it('正常にユーザー設定を更新できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
        slackWebhookUrl:
          'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        notificationEnabled: true,
      };
      const expectedSettings = UserSettingsFactory.createUserSettings({
        userId: appUser.id,
        displayName: updateParams.displayName,
        slackWebhookUrl: updateParams.slackWebhookUrl,
        notificationEnabled: updateParams.notificationEnabled,
        updatedAt: new Date(),
      });
      mockRepository.updateByAppUser.mockResolvedValue(expectedSettings);

      // Act
      const result = await service.updateUserSettings(appUser, updateParams);

      // Assert
      expect(result).toEqual(expectedSettings);
      expect(mockRepository.updateByAppUser).toHaveBeenCalledWith(
        appUser,
        updateParams,
      );
    });

    it('部分更新が正常に動作すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
      };
      const expectedSettings = UserSettingsFactory.createUserSettings({
        userId: appUser.id,
        displayName: updateParams.displayName,
      });
      mockRepository.updateByAppUser.mockResolvedValue(expectedSettings);

      // Act
      const result = await service.updateUserSettings(appUser, updateParams);

      // Assert
      expect(result).toEqual(expectedSettings);
      expect(mockRepository.updateByAppUser).toHaveBeenCalledWith(
        appUser,
        updateParams,
      );
    });

    it('無効なSlack Webhook URLの場合、UserSettingsUpdateErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        slackWebhookUrl: 'invalid-url',
      };

      // Act & Assert
      await expect(
        service.updateUserSettings(appUser, updateParams),
      ).rejects.toThrow(UserSettingsUpdateError);
      expect(mockRepository.updateByAppUser).not.toHaveBeenCalled();
    });

    it('データベースエラーが発生した場合、UserSettingsUpdateErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
      };
      mockRepository.updateByAppUser.mockRejectedValue(
        new Error('データベースエラー'),
      );

      // Act & Assert
      await expect(
        service.updateUserSettings(appUser, updateParams),
      ).rejects.toThrow(UserSettingsUpdateError);
      expect(mockRepository.updateByAppUser).toHaveBeenCalledWith(
        appUser,
        updateParams,
      );
    });
  });

  describe('testSlackWebhook', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      // fetchのモックをリセット
      mockFetch.mockReset();
    });

    it('正常なWebhook URLでテストが成功すること', async () => {
      // Arrange
      const webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      // Act
      const result = await service.testSlackWebhook(webhookUrl);

      // Assert
      expect(result.success).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(mockFetch).toHaveBeenCalledWith(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'TechPostCast テスト通知',
          icon_emoji: ':test_tube:',
          text: 'Slack Webhook URLの接続テストです。この通知が表示されれば設定は正常です。',
        }),
      });
    });

    it('無効なWebhook URLの場合、SlackWebhookTestErrorが発生すること', async () => {
      // Arrange
      const webhookUrl = 'invalid-url';

      // Act & Assert
      await expect(service.testSlackWebhook(webhookUrl)).rejects.toThrow(
        SlackWebhookTestError,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('Slack APIエラーの場合、失敗結果を返すこと', async () => {
      // Arrange
      const webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      // Act
      const result = await service.testSlackWebhook(webhookUrl);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Slack API エラー: 404 Not Found');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('ネットワークエラーの場合、SlackWebhookTestErrorが発生すること', async () => {
      // Arrange
      const webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      mockFetch.mockRejectedValue(new Error('Network Error'));

      // Act & Assert
      await expect(service.testSlackWebhook(webhookUrl)).rejects.toThrow(
        SlackWebhookTestError,
      );
      expect(mockFetch).toHaveBeenCalled();
    });

    it('タイムアウトの場合、SlackWebhookTestErrorが発生すること', async () => {
      // Arrange
      const webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      // Act & Assert
      await expect(service.testSlackWebhook(webhookUrl)).rejects.toThrow(
        SlackWebhookTestError,
      );
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('validateSlackWebhookUrl', () => {
    it('有効なSlack Webhook URLの場合、例外が発生しないこと', () => {
      // Arrange
      const validUrls = [
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        'https://hooks.slack.com/services/T123456789/B987654321/abcdefghijklmnopqrstuvwx',
      ];

      // Act & Assert
      validUrls.forEach((url) => {
        expect(() => service['validateSlackWebhookUrl'](url)).not.toThrow();
      });
    });

    it('無効なSlack Webhook URLの場合、例外が発生すること', () => {
      // Arrange
      const invalidUrls = [
        'https://example.com/webhook',
        'https://hooks.slack.com/services/invalid',
        'http://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', // httpプロトコル
        'not-a-url',
        '',
      ];

      // Act & Assert
      invalidUrls.forEach((url) => {
        expect(() => service['validateSlackWebhookUrl'](url)).toThrow();
      });
    });
  });

  describe('maskWebhookUrl', () => {
    it('Webhook URLを正しくマスクすること', () => {
      // Arrange
      const webhookUrl =
        'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
      const expectedMasked =
        'https://hooks.slack.com/services/T00000000/B00000000/***';

      // Act
      const result = service['maskWebhookUrl'](webhookUrl);

      // Assert
      expect(result).toBe(expectedMasked);
    });

    it('空文字列の場合、空文字列を返すこと', () => {
      // Arrange
      const webhookUrl = '';

      // Act
      const result = service['maskWebhookUrl'](webhookUrl);

      // Assert
      expect(result).toBe('');
    });

    it('短いURLの場合、マスクして返すこと', () => {
      // Arrange
      const webhookUrl = 'https://example.com';

      // Act
      const result = service['maskWebhookUrl'](webhookUrl);

      // Assert
      expect(result).toBe('https://***');
    });
  });
});
