import { AppConfigService } from '@/app-config/app-config.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SlackNotificationService } from '@tech-post-cast/commons';
import { NotificationBatchService } from './notification-batch.service';

// SlackNotificationServiceをモック化
jest.mock('@tech-post-cast/commons', () => ({
  ...jest.requireActual('@tech-post-cast/commons'),
  SlackNotificationService: {
    buildPersonalProgramNotificationMessage: jest.fn(),
    sendNotification: jest.fn(),
    maskWebhookUrl: jest.fn(),
  },
}));

describe('NotificationBatchService', () => {
  let service: NotificationBatchService;
  let mockRepository: any;
  let mockAppConfigService: any;
  let mockSlackService: jest.Mocked<typeof SlackNotificationService>;

  beforeEach(async () => {
    // リポジトリのモック
    mockRepository = {
      findUnnotifiedDataByUser: jest.fn(),
      updateNotificationStatus: jest.fn(),
      updateNotificationStatusBatch: jest.fn(),
    };

    // AppConfigServiceのモック
    mockAppConfigService = {
      LpBaseUrl: 'https://techpostcast.com',
      ProgramAudioFileUrlPrefix: 'https://program-files.techpostcast.com/audio',
    };

    // SlackNotificationServiceのモック
    mockSlackService = SlackNotificationService as jest.Mocked<
      typeof SlackNotificationService
    >;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationBatchService,
        {
          provide: 'PersonalizedProgramAttemptsRepository',
          useValue: mockRepository,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationBatchService>(NotificationBatchService);

    // ログをモック化
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotifications', () => {
    it('通知対象のレコードが存在しない場合、空の結果を返すこと', async () => {
      // Arrange
      mockRepository.findUnnotifiedDataByUser.mockResolvedValue([]);

      // Act
      const result = await service.sendNotifications();

      // Assert
      expect(result.totalUsers).toBe(0);
      expect(result.successUsers).toBe(0);
      expect(result.failedUsers).toBe(0);
      expect(result.totalAttempts).toBe(0);
    });

    it('通知対象のユーザーが存在する場合、正常に通知を送信すること', async () => {
      // Arrange
      const mockUserData: any = [
        {
          userId: 'user1',
          user: {
            displayName: 'テストユーザー1',
            slackWebhookUrl: 'https://hooks.slack.com/test1',
            notificationEnabled: true,
          },
          attempts: [
            {
              id: 'attempt1',
              status: 'SUCCESS',
              reason: null,
              postCount: 5,
              feed: { name: 'テストフィード1' },
              program: {
                id: 'program1',
                title: 'テストプログラム1',
                audioUrl: 'https://example.com/audio1.mp3',
              },
            },
          ],
        },
      ];

      mockRepository.findUnnotifiedDataByUser.mockResolvedValue(mockUserData);
      mockSlackService.buildPersonalProgramNotificationMessage.mockReturnValue({
        username: 'TechPostCast 通知',
        icon_emoji: ':microphone:',
        blocks: [],
      });
      mockSlackService.sendNotification.mockResolvedValue({
        success: true,
        responseTime: 100,
      });
      mockSlackService.maskWebhookUrl.mockReturnValue(
        'https://hooks.slack.com/***',
      );

      // Act
      const result = await service.sendNotifications();

      // Assert
      expect(result.totalUsers).toBe(1);
      expect(result.successUsers).toBe(1);
      expect(result.failedUsers).toBe(0);
      expect(result.totalAttempts).toBe(1);

      expect(
        mockSlackService.buildPersonalProgramNotificationMessage,
      ).toHaveBeenCalledWith(
        {
          displayName: 'テストユーザー1',
          attempts: [
            {
              feedName: 'テストフィード1',
              status: 'SUCCESS',
              reason: null,
              postCount: 5,
              program: {
                id: 'program1',
                title: 'テストプログラム1',
                audioUrl: 'https://example.com/audio1.mp3',
              },
            },
          ],
        },
        'https://techpostcast.com',
        'https://program-files.techpostcast.com/audio',
      );

      expect(mockSlackService.sendNotification).toHaveBeenCalledWith(
        'https://hooks.slack.com/test1',
        expect.any(Object),
      );

      expect(mockRepository.updateNotificationStatusBatch).toHaveBeenCalledWith(
        ['attempt1'],
        true,
      );
    });

    it('Slack通知送信に失敗した場合、エラーとして記録すること', async () => {
      // Arrange
      const mockUserData: any = [
        {
          userId: 'user1',
          user: {
            displayName: 'テストユーザー1',
            slackWebhookUrl: 'https://hooks.slack.com/test1',
            notificationEnabled: true,
          },
          attempts: [
            {
              id: 'attempt1',
              status: 'SUCCESS',
              reason: null,
              postCount: 5,
              feed: { name: 'テストフィード1' },
              program: null,
            },
          ],
        },
      ];

      mockRepository.findUnnotifiedDataByUser.mockResolvedValue(mockUserData);
      mockSlackService.buildPersonalProgramNotificationMessage.mockReturnValue({
        username: 'TechPostCast 通知',
        icon_emoji: ':microphone:',
        blocks: [],
      });
      mockSlackService.sendNotification.mockResolvedValue({
        success: false,
        error: 'Slack API エラー: 400 Bad Request',
        responseTime: 50,
      });
      mockSlackService.maskWebhookUrl.mockReturnValue(
        'https://hooks.slack.com/***',
      );

      // Act
      const result = await service.sendNotifications();

      // Assert
      expect(result.totalUsers).toBe(1);
      expect(result.successUsers).toBe(0);
      expect(result.failedUsers).toBe(1);
      expect(result.totalAttempts).toBe(1);

      expect(mockRepository.updateNotificationStatusBatch).toHaveBeenCalledWith(
        ['attempt1'],
        false,
        'Slack API エラー: 400 Bad Request',
      );
    });

    it('複数ユーザーの通知処理を正常に実行すること', async () => {
      // Arrange
      const mockUserData: any = [
        {
          userId: 'user1',
          user: {
            displayName: 'テストユーザー1',
            slackWebhookUrl: 'https://hooks.slack.com/test1',
            notificationEnabled: true,
          },
          attempts: [
            {
              id: 'attempt1',
              status: 'SUCCESS',
              reason: null,
              postCount: 3,
              feed: { name: 'フィード1' },
              program: null,
            },
          ],
        },
        {
          userId: 'user2',
          user: {
            displayName: 'テストユーザー2',
            slackWebhookUrl: 'https://hooks.slack.com/test2',
            notificationEnabled: true,
          },
          attempts: [
            {
              id: 'attempt2',
              status: 'FAILED',
              reason: 'API制限に達しました',
              postCount: 0,
              feed: { name: 'フィード2' },
              program: null,
            },
          ],
        },
      ];

      mockRepository.findUnnotifiedDataByUser.mockResolvedValue(mockUserData);
      mockSlackService.buildPersonalProgramNotificationMessage.mockReturnValue({
        username: 'TechPostCast 通知',
        icon_emoji: ':microphone:',
        blocks: [],
      });
      mockSlackService.sendNotification.mockResolvedValue({
        success: true,
        responseTime: 80,
      });
      mockSlackService.maskWebhookUrl.mockReturnValue(
        'https://hooks.slack.com/***',
      );

      // Act
      const result = await service.sendNotifications();

      // Assert
      expect(result.totalUsers).toBe(2);
      expect(result.successUsers).toBe(2);
      expect(result.failedUsers).toBe(0);
      expect(result.totalAttempts).toBe(2);

      expect(
        mockSlackService.buildPersonalProgramNotificationMessage,
      ).toHaveBeenCalledTimes(2);
      expect(mockSlackService.sendNotification).toHaveBeenCalledTimes(2);
      expect(
        mockRepository.updateNotificationStatusBatch,
      ).toHaveBeenCalledTimes(2);
    });
  });
});
