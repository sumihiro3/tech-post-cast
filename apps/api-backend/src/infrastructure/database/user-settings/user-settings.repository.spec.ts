import { AppUserFactory } from '@/test/factories/app-user.factory';
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
  let prismaClientManager: jest.Mocked<PrismaClientManager>;

  const mockPrismaClient = {
    appUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSettingsRepository,
        {
          provide: PrismaClientManager,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockPrismaClient),
          },
        },
      ],
    }).compile();

    repository = module.get<UserSettingsRepository>(UserSettingsRepository);
    prismaClientManager = module.get(PrismaClientManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByAppUser', () => {
    it('ユーザー設定を正常に取得できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const mockDbUser = {
        id: appUser.id,
        displayName: appUser.displayName,
        slackWebhookUrl: 'https://hooks.slack.com/test',
        notificationEnabled: true,
        rssEnabled: false,
        rssToken: null,
        rssCreatedAt: null,
        personalizedProgramDialogueEnabled: false,
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaClient.appUser.findUnique.mockResolvedValue(mockDbUser);

      // Act
      const result = await repository.findByAppUser(appUser);

      // Assert
      expect(result).toEqual({
        userId: appUser.id,
        displayName: appUser.displayName,
        slackWebhookUrl: 'https://hooks.slack.com/test',
        notificationEnabled: true,
        rssEnabled: false,
        rssCreatedAt: undefined,
        personalizedProgramDialogueEnabled: false,
        updatedAt: new Date('2024-01-01'),
      });

      expect(mockPrismaClient.appUser.findUnique).toHaveBeenCalledWith({
        where: { id: appUser.id },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          rssEnabled: true,
          rssToken: true,
          rssCreatedAt: true,
          personalizedProgramDialogueEnabled: true,
          updatedAt: true,
        },
      });
    });

    it('ユーザーが見つからない場合、UserSettingsNotFoundErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      mockPrismaClient.appUser.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.findByAppUser(appUser)).rejects.toThrow(
        UserSettingsNotFoundError,
      );
    });

    it('データベースエラーが発生した場合、UserSettingsRetrievalErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      mockPrismaClient.appUser.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(repository.findByAppUser(appUser)).rejects.toThrow(
        UserSettingsRetrievalError,
      );
    });
  });

  describe('updateByAppUser', () => {
    it('ユーザー設定を正常に更新できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams = {
        displayName: '更新されたユーザー名',
        notificationEnabled: false,
      };

      const mockUpdatedUser = {
        id: appUser.id,
        displayName: '更新されたユーザー名',
        slackWebhookUrl: null,
        notificationEnabled: false,
        rssEnabled: false,
        rssToken: null,
        rssCreatedAt: null,
        personalizedProgramDialogueEnabled: false,
        updatedAt: new Date('2024-01-02'),
      };

      mockPrismaClient.appUser.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await repository.updateByAppUser(appUser, updateParams);

      // Assert
      expect(result).toEqual({
        userId: appUser.id,
        displayName: '更新されたユーザー名',
        slackWebhookUrl: undefined,
        notificationEnabled: false,
        rssEnabled: false,
        rssCreatedAt: undefined,
        personalizedProgramDialogueEnabled: false,
        updatedAt: new Date('2024-01-02'),
      });

      expect(mockPrismaClient.appUser.update).toHaveBeenCalledWith({
        where: { id: appUser.id },
        data: {
          displayName: '更新されたユーザー名',
          notificationEnabled: false,
        },
        select: {
          id: true,
          displayName: true,
          slackWebhookUrl: true,
          notificationEnabled: true,
          rssEnabled: true,
          rssToken: true,
          rssCreatedAt: true,
          personalizedProgramDialogueEnabled: true,
          updatedAt: true,
        },
      });
    });

    it('ユーザーが見つからない場合（P2025エラー）、UserSettingsNotFoundErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams = { displayName: '更新されたユーザー名' };
      const prismaError = { code: 'P2025', message: 'Record not found' };

      mockPrismaClient.appUser.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        repository.updateByAppUser(appUser, updateParams),
      ).rejects.toThrow(UserSettingsNotFoundError);
    });

    it('その他のデータベースエラーが発生した場合、UserSettingsUpdateErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser();
      const updateParams = { displayName: '更新されたユーザー名' };

      mockPrismaClient.appUser.update.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(
        repository.updateByAppUser(appUser, updateParams),
      ).rejects.toThrow(UserSettingsUpdateError);
    });
  });
});
