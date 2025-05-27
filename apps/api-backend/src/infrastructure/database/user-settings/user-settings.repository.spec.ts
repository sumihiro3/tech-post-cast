import { UpdateUserSettingsParams } from '@/domains/user-settings/user-settings.entity';
import { AppUserFactory } from '@/test/factories';
import {
  UserSettingsNotFoundError,
  UserSettingsRetrievalError,
  UserSettingsUpdateError,
} from '@/types/errors';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager } from '@tech-post-cast/database';
import { UserSettingsRepository } from './user-settings.repository';

describe('UserSettingsRepository', () => {
  let repository: UserSettingsRepository;
  let mockPrismaClient: any;
  let mockPrismaManager: jest.Mocked<PrismaClientManager>;

  beforeEach(async () => {
    // Prismaクライアントのモック作成
    mockPrismaClient = {
      appUser: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockPrismaManager = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsRepository,
        {
          provide: PrismaClientManager,
          useValue: mockPrismaManager,
        },
      ],
    }).compile();

    repository = module.get<UserSettingsRepository>(UserSettingsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByAppUser', () => {
    it('正常にユーザー設定を取得できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithSlackNotification();
      const mockDbResult = {
        id: appUser.id,
        displayName: appUser.displayName,
        slackWebhookUrl: appUser.slackWebhookUrl,
        notificationEnabled: appUser.notificationEnabled,
        updatedAt: appUser.updatedAt,
      };
      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockDbResult);

      // Act
      const result = await repository.findByAppUser(appUser);

      // Assert
      expect(result).toEqual({
        userId: appUser.id,
        displayName: appUser.displayName,
        slackWebhookUrl: appUser.slackWebhookUrl,
        notificationEnabled: appUser.notificationEnabled,
        updatedAt: appUser.updatedAt,
      });
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: { id: appUser.id },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          updatedAt: true,
        },
      });
    });

    it('slackWebhookUrlがnullの場合、undefinedに変換されること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithNotificationDisabled();
      const mockDbResult = {
        id: appUser.id,
        displayName: appUser.displayName,
        slackWebhookUrl: null,
        notificationEnabled: appUser.notificationEnabled,
        updatedAt: appUser.updatedAt,
      };
      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockDbResult);

      // Act
      const result = await repository.findByAppUser(appUser);

      // Assert
      expect(result.slackWebhookUrl).toBeUndefined();
    });

    it('ユーザーが見つからない場合、UserSettingsNotFoundErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      mockPrismaClient.appUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.findByAppUser(appUser)).rejects.toThrow(
        UserSettingsNotFoundError,
      );
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: { id: appUser.id },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          updatedAt: true,
        },
      });
    });

    it('データベースエラーが発生した場合、UserSettingsRetrievalErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      mockPrismaClient.appUser.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(repository.findByAppUser(appUser)).rejects.toThrow(
        UserSettingsRetrievalError,
      );
      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalled();
    });
  });

  describe('updateByAppUser', () => {
    it('正常にユーザー設定を更新できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
        slackWebhookUrl:
          'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        notificationEnabled: true,
      };
      const mockDbResult = {
        id: appUser.id,
        displayName: updateParams.displayName,
        slackWebhookUrl: updateParams.slackWebhookUrl,
        notificationEnabled: updateParams.notificationEnabled,
        updatedAt: new Date(),
      };
      mockPrismaClient.appUser.update.mockResolvedValue(mockDbResult);

      // Act
      const result = await repository.updateByAppUser(appUser, updateParams);

      // Assert
      expect(result).toEqual({
        userId: appUser.id,
        displayName: updateParams.displayName,
        slackWebhookUrl: updateParams.slackWebhookUrl,
        notificationEnabled: updateParams.notificationEnabled,
        updatedAt: mockDbResult.updatedAt,
      });
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: appUser.id },
        data: {
          displayName: updateParams.displayName,
          slackWebhookUrl: updateParams.slackWebhookUrl,
          notificationEnabled: updateParams.notificationEnabled,
        },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          updatedAt: true,
        },
      });
    });

    it('部分更新が正常に動作すること（undefinedフィールドは更新されない）', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
        // slackWebhookUrlとnotificationEnabledは未定義
      };
      const mockDbResult = {
        id: appUser.id,
        displayName: updateParams.displayName,
        slackWebhookUrl: appUser.slackWebhookUrl,
        notificationEnabled: appUser.notificationEnabled,
        updatedAt: new Date(),
      };
      mockPrismaClient.appUser.update.mockResolvedValue(mockDbResult);

      // Act
      const result = await repository.updateByAppUser(appUser, updateParams);

      // Assert
      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: appUser.id },
        data: {
          displayName: updateParams.displayName,
          // undefinedフィールドは含まれない
        },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          updatedAt: true,
        },
      });
    });

    it('ユーザーが見つからない場合（P2025エラー）、UserSettingsNotFoundErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
      };
      const prismaError = new Error('Record not found');
      (prismaError as any).code = 'P2025';
      mockPrismaClient.appUser.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        repository.updateByAppUser(appUser, updateParams),
      ).rejects.toThrow(UserSettingsNotFoundError);
      expect(mockPrismaClient.appUser.update).toHaveBeenCalled();
    });

    it('その他のデータベースエラーが発生した場合、UserSettingsUpdateErrorが発生すること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        displayName: 'Updated User',
      };
      mockPrismaClient.appUser.update.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        repository.updateByAppUser(appUser, updateParams),
      ).rejects.toThrow(UserSettingsUpdateError);
      expect(mockPrismaClient.appUser.update).toHaveBeenCalled();
    });

    it('slackWebhookUrlがnullの場合、undefinedに変換されること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams: UpdateUserSettingsParams = {
        slackWebhookUrl: undefined,
        notificationEnabled: false,
      };
      const mockDbResult = {
        id: appUser.id,
        displayName: appUser.displayName,
        slackWebhookUrl: null,
        notificationEnabled: false,
        updatedAt: new Date(),
      };
      mockPrismaClient.appUser.update.mockResolvedValue(mockDbResult);

      // Act
      const result = await repository.updateByAppUser(appUser, updateParams);

      // Assert
      expect(result.slackWebhookUrl).toBeUndefined();
    });
  });
});
