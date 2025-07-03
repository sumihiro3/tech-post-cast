import {
  PersonalizedProgramNotificationDataError,
  PersonalizedProgramNotificationStatusUpdateError,
} from '@/types/errors';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager } from '@tech-post-cast/database';
import { PersonalizedProgramAttemptsRepository } from './personalized-program-attempts.repository';

describe('PersonalizedProgramAttemptsRepository', () => {
  let repository: PersonalizedProgramAttemptsRepository;
  let prismaClientManager: any;

  beforeEach(async () => {
    const mockPrismaClient = {
      personalizedProgramAttempt: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const mockPrismaClientManager = {
      getClient: jest.fn().mockReturnValue(mockPrismaClient),
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedProgramAttemptsRepository,
        {
          provide: PrismaClientManager,
          useValue: mockPrismaClientManager,
        },
      ],
    }).compile();

    repository = module.get<PersonalizedProgramAttemptsRepository>(
      PersonalizedProgramAttemptsRepository,
    );
    prismaClientManager = module.get(PrismaClientManager);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findUnnotifiedDataByUser', () => {
    it('未通知レコードが存在しない場合、空配列を返す', async () => {
      // Arrange
      const targetDate = new Date('2024-01-01');
      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findUnnotifiedDataByUser(targetDate);

      // Assert
      expect(result).toEqual([]);
    });

    it('通知可能なユーザーのデータを正しく集約する', async () => {
      // Arrange
      const targetDate = new Date('2024-01-01');
      const mockAttempts = [
        {
          id: 'attempt1',
          userId: 'user1',
          feedId: 'feed1',
          status: 'SUCCESS',
          reason: null,
          postCount: 3,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          notified: false,
          notifiedAt: null,
          notificationSuccess: null,
          notificationError: null,
          programId: 'program1',
          user: {
            id: 'user1',
            displayName: 'Test User 1',
            slackWebhookUrl: 'https://hooks.slack.com/test1',
            notificationEnabled: true,
          },
          feed: {
            id: 'feed1',
            name: 'TypeScript記事',
          },
          program: {
            id: 'program1',
            title: 'TypeScript最新情報',
            audioUrl: 'https://example.com/audio1.mp3',
          },
        },
        {
          id: 'attempt2',
          userId: 'user1',
          feedId: 'feed2',
          status: 'FAILED',
          reason: 'NOT_ENOUGH_POSTS',
          postCount: 0,
          createdAt: new Date('2024-01-01T11:00:00Z'),
          notified: false,
          notifiedAt: null,
          notificationSuccess: null,
          notificationError: null,
          programId: null,
          user: {
            id: 'user1',
            displayName: 'Test User 1',
            slackWebhookUrl: 'https://hooks.slack.com/test1',
            notificationEnabled: true,
          },
          feed: {
            id: 'feed2',
            name: 'React記事',
          },
          program: null,
        },
      ];

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttempts,
      );

      // Act
      const result = await repository.findUnnotifiedDataByUser(targetDate);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user1',
        user: {
          displayName: 'Test User 1',
          slackWebhookUrl: 'https://hooks.slack.com/test1',
          notificationEnabled: true,
        },
        attempts: mockAttempts,
      });
    });

    it('通知が無効なユーザーは除外される', async () => {
      // Arrange
      const targetDate = new Date('2024-01-01');
      const mockAttempts = [
        {
          id: 'attempt1',
          userId: 'user1',
          feedId: 'feed1',
          status: 'SUCCESS',
          reason: null,
          postCount: 3,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          notified: false,
          notifiedAt: null,
          notificationSuccess: null,
          notificationError: null,
          programId: null,
          user: {
            id: 'user1',
            displayName: 'Test User 1',
            slackWebhookUrl: 'https://hooks.slack.com/test1',
            notificationEnabled: false, // 通知無効
          },
          feed: {
            id: 'feed1',
            name: 'TypeScript記事',
          },
          program: null,
        },
      ];

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttempts,
      );

      // Act
      const result = await repository.findUnnotifiedDataByUser(targetDate);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('Slack Webhook URLが未設定のユーザーは除外される', async () => {
      // Arrange
      const targetDate = new Date('2024-01-01');
      const mockAttempts = [
        {
          id: 'attempt1',
          userId: 'user1',
          feedId: 'feed1',
          status: 'SUCCESS',
          reason: null,
          postCount: 3,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          notified: false,
          notifiedAt: null,
          notificationSuccess: null,
          notificationError: null,
          programId: null,
          user: {
            id: 'user1',
            displayName: 'Test User 1',
            slackWebhookUrl: null, // Webhook URL未設定
            notificationEnabled: true,
          },
          feed: {
            id: 'feed1',
            name: 'TypeScript記事',
          },
          program: null,
        },
      ];

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.findMany.mockResolvedValue(
        mockAttempts,
      );

      // Act
      const result = await repository.findUnnotifiedDataByUser(targetDate);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('データベースエラー時は適切なエラーを投げる', async () => {
      // Arrange
      const targetDate = new Date('2024-01-01');
      const mockError = new Error('Database connection failed');
      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.findMany.mockRejectedValue(
        mockError,
      );

      // Act & Assert
      await expect(
        repository.findUnnotifiedDataByUser(targetDate),
      ).rejects.toThrow(PersonalizedProgramNotificationDataError);
    });
  });

  describe('updateNotificationStatus', () => {
    it('通知ステータスを正常に更新する', async () => {
      // Arrange
      const updates = [
        {
          attemptIds: ['attempt1', 'attempt2'],
          success: true,
        },
        {
          attemptIds: ['attempt3'],
          success: false,
          error: 'Slack webhook failed',
        },
      ];

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return await callback();
      });

      prismaClientManager.transaction.mockImplementation(mockTransaction);

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.updateMany.mockResolvedValue({
        count: 3,
      });

      // Act
      await repository.updateNotificationStatus(updates);

      // Assert
      expect(prismaClientManager.transaction).toHaveBeenCalledTimes(1);
      expect(
        mockClient.personalizedProgramAttempt.updateMany,
      ).toHaveBeenCalledTimes(2);
    });

    it('更新処理でエラーが発生した場合は適切なエラーを投げる', async () => {
      // Arrange
      const updates = [
        {
          attemptIds: ['attempt1'],
          success: true,
        },
      ];

      const mockError = new Error('Update failed');
      prismaClientManager.transaction.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        repository.updateNotificationStatus(updates),
      ).rejects.toThrow(PersonalizedProgramNotificationStatusUpdateError);
    });
  });

  describe('updateNotificationStatusBatch', () => {
    it('一括更新を正常に実行する', async () => {
      // Arrange
      const attemptIds = ['attempt1', 'attempt2', 'attempt3'];
      const success = true;

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.updateMany.mockResolvedValue({
        count: 3,
      });

      // Act
      await repository.updateNotificationStatusBatch(attemptIds, success);

      // Assert
      expect(
        mockClient.personalizedProgramAttempt.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          id: {
            in: attemptIds,
          },
        },
        data: {
          notified: true,
          notifiedAt: expect.any(Date),
          notificationSuccess: success,
          notificationError: null,
        },
      });
    });

    it('エラーメッセージ付きで一括更新を実行する', async () => {
      // Arrange
      const attemptIds = ['attempt1'];
      const success = false;
      const error = 'Notification failed';

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.updateMany.mockResolvedValue({
        count: 1,
      });

      // Act
      await repository.updateNotificationStatusBatch(
        attemptIds,
        success,
        error,
      );

      // Assert
      expect(
        mockClient.personalizedProgramAttempt.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          id: {
            in: attemptIds,
          },
        },
        data: {
          notified: true,
          notifiedAt: expect.any(Date),
          notificationSuccess: success,
          notificationError: error,
        },
      });
    });

    it('更新処理でエラーが発生した場合は適切なエラーを投げる', async () => {
      // Arrange
      const attemptIds = ['attempt1'];
      const success = true;
      const mockError = new Error('Database error');

      const mockClient = prismaClientManager.getClient();
      mockClient.personalizedProgramAttempt.updateMany.mockRejectedValue(
        mockError,
      );

      // Act & Assert
      await expect(
        repository.updateNotificationStatusBatch(attemptIds, success),
      ).rejects.toThrow(PersonalizedProgramNotificationStatusUpdateError);
    });
  });
});
