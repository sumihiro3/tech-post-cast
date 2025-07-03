import { AppConfigService } from '@/app-config/app-config.service';
import { IAppUsersRepository } from '@/domains/app-users/app-users.repository.interface';
import { AppUserFactory, UserSettingsFactory } from '@/test/factories';
import {
  SlackWebhookTestError,
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import { Test, TestingModule } from '@nestjs/testing';
import { RssFileService } from './rss-file.service';
import {
  UpdateRssSettingsParams,
  UpdateUserSettingsParams,
} from './user-settings.entity';
import { IUserSettingsRepository } from './user-settings.repository.interface';
import { UserSettingsService } from './user-settings.service';

// fetchのモック
global.fetch = jest.fn();

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let mockRepository: jest.Mocked<IUserSettingsRepository>;
  let mockAppUserRepository: jest.Mocked<IAppUsersRepository>;
  let mockAppConfigService: any;
  let mockRssFileService: jest.Mocked<RssFileService>;

  beforeEach(async () => {
    // リポジトリのモック作成
    mockRepository = {
      findByAppUser: jest.fn(),
      updateByAppUser: jest.fn(),
    };

    mockAppUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOneWithSubscription: jest.fn(),
      findByRssToken: jest.fn(),
      updateRssSettings: jest.fn(),
      regenerateRssToken: jest.fn(),
    };

    mockAppConfigService = {
      RssUrlPrefix: 'https://rss.techpostcast.com',
    };

    mockRssFileService = {
      generateUserRssFile: jest.fn(),
      uploadRssFile: jest.fn(),
      generateAndUploadUserRss: jest.fn(),
      deleteUserRssFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsService,
        {
          provide: 'UserSettingsRepository',
          useValue: mockRepository,
        },
        {
          provide: 'AppUserRepository',
          useValue: mockAppUserRepository,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
        {
          provide: RssFileService,
          useValue: mockRssFileService,
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

  describe('updateRssSettings', () => {
    it('RSS機能を有効化し、新しいトークンを生成してRSSファイルを生成・アップロードすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser({
        rssEnabled: false,
        rssToken: null,
      });
      const params: UpdateRssSettingsParams = { rssEnabled: true };

      const updatedAppUser = AppUserFactory.createUserWithRssEnabled();
      mockAppUserRepository.updateRssSettings.mockResolvedValue(updatedAppUser);
      mockAppUserRepository.findOne.mockResolvedValue(updatedAppUser);

      const expectedUserSettings =
        UserSettingsFactory.createUserSettingsWithRssEnabled();
      mockRepository.findByAppUser.mockResolvedValue(expectedUserSettings);

      const mockUploadResult = {
        rssUrl: 'https://rss.techpostcast.com/u/test-token/rss.xml',
        episodeCount: 5,
        generatedAt: new Date(),
      };
      mockRssFileService.generateAndUploadUserRss.mockResolvedValue(
        mockUploadResult,
      );

      // Act
      const result = await service.updateRssSettings(appUser, params);

      // Assert
      expect(result).toEqual(expectedUserSettings);
      expect(mockAppUserRepository.updateRssSettings).toHaveBeenCalledWith(
        appUser.id,
        true,
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      );
      expect(mockRssFileService.generateAndUploadUserRss).toHaveBeenCalledWith(
        updatedAppUser,
      );
    });

    it('RSS機能を無効化すること（RSSファイル生成・アップロードは実行されない）', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const params: UpdateRssSettingsParams = { rssEnabled: false };

      const updatedAppUser = AppUserFactory.createUserWithRssDisabled();
      mockAppUserRepository.updateRssSettings.mockResolvedValue(updatedAppUser);
      mockAppUserRepository.findOne.mockResolvedValue(updatedAppUser);

      const expectedUserSettings =
        UserSettingsFactory.createUserSettingsWithRssDisabled();
      mockRepository.findByAppUser.mockResolvedValue(expectedUserSettings);

      mockRssFileService.deleteUserRssFile.mockResolvedValue(undefined);

      // Act
      const result = await service.updateRssSettings(appUser, params);

      // Assert
      expect(result).toEqual(expectedUserSettings);
      expect(mockAppUserRepository.updateRssSettings).toHaveBeenCalledWith(
        appUser.id,
        false,
        undefined,
      );
      expect(
        mockRssFileService.generateAndUploadUserRss,
      ).not.toHaveBeenCalled();
      expect(mockRssFileService.deleteUserRssFile).toHaveBeenCalledWith(
        appUser.rssToken,
        updatedAppUser.id,
      );
    });

    it('RSS機能無効化時に古いファイル削除でエラーが発生しても、RSS設定更新は成功すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const params: UpdateRssSettingsParams = { rssEnabled: false };

      const updatedAppUser = AppUserFactory.createUserWithRssDisabled();
      mockAppUserRepository.updateRssSettings.mockResolvedValue(updatedAppUser);
      mockAppUserRepository.findOne.mockResolvedValue(updatedAppUser);

      const expectedUserSettings =
        UserSettingsFactory.createUserSettingsWithRssDisabled();
      mockRepository.findByAppUser.mockResolvedValue(expectedUserSettings);

      // 古いファイル削除でエラーが発生
      mockRssFileService.deleteUserRssFile.mockRejectedValue(
        new Error('Delete failed'),
      );

      // Act
      const result = await service.updateRssSettings(appUser, params);

      // Assert
      expect(result).toEqual(expectedUserSettings);
      expect(mockAppUserRepository.updateRssSettings).toHaveBeenCalledWith(
        appUser.id,
        false,
        undefined,
      );
      expect(mockRssFileService.deleteUserRssFile).toHaveBeenCalledWith(
        appUser.rssToken,
        updatedAppUser.id,
      );
    });

    it('既存のRSSトークンがある場合、再利用すること（RSSファイル生成・アップロードは実行されない）', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const params: UpdateRssSettingsParams = { rssEnabled: true };

      const updatedAppUser = AppUserFactory.createUserWithRssEnabled();
      mockAppUserRepository.updateRssSettings.mockResolvedValue(updatedAppUser);
      mockAppUserRepository.findOne.mockResolvedValue(updatedAppUser);

      const expectedUserSettings =
        UserSettingsFactory.createUserSettingsWithRssEnabled();
      mockRepository.findByAppUser.mockResolvedValue(expectedUserSettings);

      // Act
      const result = await service.updateRssSettings(appUser, params);

      // Assert
      expect(result).toEqual(expectedUserSettings);
      expect(mockAppUserRepository.updateRssSettings).toHaveBeenCalledWith(
        appUser.id,
        true,
        undefined, // 既存トークンがある場合はundefined
      );
      expect(
        mockRssFileService.generateAndUploadUserRss,
      ).not.toHaveBeenCalled();
    });

    it('RSSファイル生成・アップロードでエラーが発生しても、RSS設定更新は成功すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser({
        rssEnabled: false,
        rssToken: null,
      });
      const params: UpdateRssSettingsParams = { rssEnabled: true };

      const updatedAppUser = AppUserFactory.createUserWithRssEnabled();
      mockAppUserRepository.updateRssSettings.mockResolvedValue(updatedAppUser);
      mockAppUserRepository.findOne.mockResolvedValue(updatedAppUser);

      const expectedUserSettings =
        UserSettingsFactory.createUserSettingsWithRssEnabled();
      mockRepository.findByAppUser.mockResolvedValue(expectedUserSettings);

      // RSSファイル生成・アップロードでエラーが発生
      mockRssFileService.generateAndUploadUserRss.mockRejectedValue(
        new Error('RSS file generation failed'),
      );

      // Act
      const result = await service.updateRssSettings(appUser, params);

      // Assert
      expect(result).toEqual(expectedUserSettings);
      expect(mockAppUserRepository.updateRssSettings).toHaveBeenCalledWith(
        appUser.id,
        true,
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      );
      expect(mockRssFileService.generateAndUploadUserRss).toHaveBeenCalledWith(
        updatedAppUser,
      );
    });

    it('データベースエラーが発生した場合、UserSettingsUpdateErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const params: UpdateRssSettingsParams = { rssEnabled: true };

      mockAppUserRepository.updateRssSettings.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.updateRssSettings(appUser, params)).rejects.toThrow(
        UserSettingsUpdateError,
      );
      expect(
        mockRssFileService.generateAndUploadUserRss,
      ).not.toHaveBeenCalled();
    });
  });

  describe('regenerateRssToken', () => {
    it('RSS機能が有効なユーザーのトークンを再生成し、古いファイルを削除して新しいファイルを生成すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const newToken = '550e8400-e29b-41d4-a716-446655440001';
      const updatedAppUser = AppUserFactory.createUserWithRssEnabled({
        rssToken: newToken,
        rssCreatedAt: new Date('2024-01-01'),
      });

      mockAppUserRepository.regenerateRssToken.mockResolvedValue(
        updatedAppUser,
      );

      const mockUploadResult = {
        rssUrl: 'https://rss.techpostcast.com/u/new-token/rss.xml',
        episodeCount: 5,
        generatedAt: new Date(),
      };
      mockRssFileService.deleteUserRssFile.mockResolvedValue(undefined);
      mockRssFileService.generateAndUploadUserRss.mockResolvedValue(
        mockUploadResult,
      );

      // Act
      const result = await service.regenerateRssToken(appUser);

      // Assert
      expect(result.rssToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.rssUrl).toBe(
        `https://rss.techpostcast.com/u/${result.rssToken}/rss.xml`,
      );
      expect(result.rssCreatedAt).toEqual(new Date('2024-01-01'));
      expect(mockAppUserRepository.regenerateRssToken).toHaveBeenCalledWith(
        appUser.id,
        expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ),
      );
      expect(mockRssFileService.deleteUserRssFile).toHaveBeenCalledWith(
        appUser.rssToken,
        updatedAppUser.id,
      );
      expect(mockRssFileService.generateAndUploadUserRss).toHaveBeenCalledWith(
        updatedAppUser,
      );
    });

    it('古いファイル削除でエラーが発生しても、RSSトークン再生成は成功すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const newToken = '550e8400-e29b-41d4-a716-446655440001';
      const updatedAppUser = AppUserFactory.createUserWithRssEnabled({
        rssToken: newToken,
        rssCreatedAt: new Date('2024-01-01'),
      });

      mockAppUserRepository.regenerateRssToken.mockResolvedValue(
        updatedAppUser,
      );

      const mockUploadResult = {
        rssUrl: 'https://rss.techpostcast.com/u/new-token/rss.xml',
        episodeCount: 5,
        generatedAt: new Date(),
      };
      // 古いファイル削除でエラーが発生
      mockRssFileService.deleteUserRssFile.mockRejectedValue(
        new Error('Delete failed'),
      );
      mockRssFileService.generateAndUploadUserRss.mockResolvedValue(
        mockUploadResult,
      );

      // Act
      const result = await service.regenerateRssToken(appUser);

      // Assert
      expect(result.rssToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(mockRssFileService.deleteUserRssFile).toHaveBeenCalledWith(
        appUser.rssToken,
        updatedAppUser.id,
      );
      expect(mockRssFileService.generateAndUploadUserRss).toHaveBeenCalledWith(
        updatedAppUser,
      );
    });

    it('新しいファイル生成でエラーが発生しても、RSSトークン再生成は成功すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const newToken = '550e8400-e29b-41d4-a716-446655440001';
      const updatedAppUser = AppUserFactory.createUserWithRssEnabled({
        rssToken: newToken,
        rssCreatedAt: new Date('2024-01-01'),
      });

      mockAppUserRepository.regenerateRssToken.mockResolvedValue(
        updatedAppUser,
      );

      mockRssFileService.deleteUserRssFile.mockResolvedValue(undefined);
      // 新しいファイル生成でエラーが発生
      mockRssFileService.generateAndUploadUserRss.mockRejectedValue(
        new Error('RSS generation failed'),
      );

      // Act
      const result = await service.regenerateRssToken(appUser);

      // Assert
      expect(result.rssToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(mockRssFileService.deleteUserRssFile).toHaveBeenCalledWith(
        appUser.rssToken,
        updatedAppUser.id,
      );
      expect(mockRssFileService.generateAndUploadUserRss).toHaveBeenCalledWith(
        updatedAppUser,
      );
    });

    it('RSS機能が無効なユーザーの場合、UserSettingsUpdateErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssDisabled();

      // Act & Assert
      await expect(service.regenerateRssToken(appUser)).rejects.toThrow(
        UserSettingsUpdateError,
      );
    });

    it('データベースエラーが発生した場合、UserSettingsUpdateErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();

      mockAppUserRepository.regenerateRssToken.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.regenerateRssToken(appUser)).rejects.toThrow(
        UserSettingsUpdateError,
      );
    });
  });

  describe('getRssUrl', () => {
    it('RSS機能が有効でトークンがある場合、RSS URLを返すこと', () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled({
        rssToken: 'test-token-123',
      });

      // Act
      const result = service.getRssUrl(appUser);

      // Assert
      expect(result).toBe(
        'https://rss.techpostcast.com/u/test-token-123/rss.xml',
      );
    });

    it('RSS機能が無効な場合、undefinedを返すこと', () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssDisabled();

      // Act
      const result = service.getRssUrl(appUser);

      // Assert
      expect(result).toBeUndefined();
    });

    it('RSS機能が有効でもトークンがない場合、undefinedを返すこと', () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser({
        rssEnabled: true,
        rssToken: null,
      });

      // Act
      const result = service.getRssUrl(appUser);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
