import {
  AppUserNotFoundError,
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAlreadyExistsError,
  RssFileGenerationError,
  RssFileUploadError,
} from '@/types/errors';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JsonValue } from '@prisma/client/runtime/library';
import { PersonalizedFeedWithFilters } from '@tech-post-cast/database';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { AppConfigService } from '../../app-config/app-config.service';
import { PersonalizedFeedsBuilder } from '../../domains/radio-program/personalized-feed/personalized-feeds-builder';
import { PersonalizedFeedCreateRequestDto } from './dto/personalized-feed.dto';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

const moduleMocker = new ModuleMocker(global);

describe('PersonalizedFeedsController', () => {
  let controller: PersonalizedFeedsController;
  let personalizedFeedsBuilder: PersonalizedFeedsBuilder;
  let appConfigService: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalizedFeedsController],
    })
      .useMocker((token) => {
        if (token === PersonalizedFeedsBuilder) {
          return {
            getActiveFeeds: jest.fn(),
            buildProgramByFeed: jest.fn(),
          };
        }
        if (token === AppConfigService) {
          return {
            SlackIncomingWebhookUrl: 'https://hooks.slack.com/services/test',
          };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<PersonalizedFeedsController>(
      PersonalizedFeedsController,
    );
    personalizedFeedsBuilder = module.get<PersonalizedFeedsBuilder>(
      PersonalizedFeedsBuilder,
    );
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(personalizedFeedsBuilder).toBeDefined();
    expect(appConfigService).toBeDefined();
  });

  describe('getActiveFeeds', () => {
    it('should return active feeds', async () => {
      const mockActiveFeeds = [
        {
          id: 'feed-1',
          name: 'Feed 1',
          description: 'Test feed 1',
          filterGroups: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-1',
          isActive: true,
        },
        {
          id: 'feed-2',
          name: 'Feed 2',
          description: 'Test feed 2',
          filterGroups: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-1',
          isActive: true,
        },
      ] as unknown as PersonalizedFeedWithFilters[];

      jest
        .spyOn(personalizedFeedsBuilder, 'getActiveFeeds')
        .mockResolvedValue(mockActiveFeeds);

      const result = await controller.getActiveFeeds();

      expect(personalizedFeedsBuilder.getActiveFeeds).toHaveBeenCalled();
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('feed-1');
      expect(result[1].id).toBe('feed-2');
    });

    it('should throw InternalServerErrorException when builder throws an error', async () => {
      const mockError = new Error('Builder error');
      jest
        .spyOn(personalizedFeedsBuilder, 'getActiveFeeds')
        .mockRejectedValue(mockError);

      await expect(controller.getActiveFeeds()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generateProgramByFeed', () => {
    it('should generate a program by feed successfully', async () => {
      const dto = new PersonalizedFeedCreateRequestDto();
      dto.feedId = 'feed-1';
      dto.daysAgo = 0;

      const mockProgramDate = new Date();
      jest.spyOn(dto, 'getProgramDate').mockReturnValue(mockProgramDate);

      const mockResult = {
        program: {
          id: 'program-1',
          title: 'Test Program',
          createdAt: new Date(),
          updatedAt: new Date(),
          feedId: 'feed-1',
          userId: 'user-1',
          programDate: new Date(),
          audioUrl: 'https://example.com/audio.mp3',
          audioDuration: 1000,
          script: {} as JsonValue,
          chapters: [] as JsonValue,
          imageUrl: 'https://example.com/image.jpg',
          expiresAt: new Date(),
          isExpired: false,
        },
        qiitaApiRateRemaining: 50,
        qiitaApiRateReset: 1234567890,
      };

      jest
        .spyOn(personalizedFeedsBuilder, 'buildProgramByFeed')
        .mockResolvedValue(mockResult);

      const result = await controller.generateProgramByFeed(dto);

      expect(personalizedFeedsBuilder.buildProgramByFeed).toHaveBeenCalledWith(
        dto.feedId,
        mockProgramDate,
      );
      expect(result.programId).toBe('program-1');
      expect(result.qiitaApiRateRemaining).toBe(50);
      expect(result.qiitaApiRateReset).toBe(1234567890);
    });

    it('should throw NotFoundException when PersonalizedFeedNotFoundError is thrown', async () => {
      const dto = new PersonalizedFeedCreateRequestDto();
      dto.feedId = 'non-existent-feed';
      dto.daysAgo = 0;

      jest
        .spyOn(personalizedFeedsBuilder, 'buildProgramByFeed')
        .mockRejectedValue(new PersonalizedFeedNotFoundError('Feed not found'));

      await expect(controller.generateProgramByFeed(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when AppUserNotFoundError is thrown', async () => {
      const dto = new PersonalizedFeedCreateRequestDto();
      dto.feedId = 'feed-1';
      dto.daysAgo = 0;

      jest
        .spyOn(personalizedFeedsBuilder, 'buildProgramByFeed')
        .mockRejectedValue(new AppUserNotFoundError('User not found'));

      await expect(controller.generateProgramByFeed(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when PersonalizedProgramAlreadyExistsError is thrown', async () => {
      const dto = new PersonalizedFeedCreateRequestDto();
      dto.feedId = 'feed-1';
      dto.daysAgo = 0;

      const programDate = new Date();
      jest
        .spyOn(personalizedFeedsBuilder, 'buildProgramByFeed')
        .mockRejectedValue(
          new PersonalizedProgramAlreadyExistsError(
            'Program already exists',
            programDate,
          ),
        );

      await expect(controller.generateProgramByFeed(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const dto = new PersonalizedFeedCreateRequestDto();
      dto.feedId = 'feed-1';
      dto.daysAgo = 0;

      jest
        .spyOn(personalizedFeedsBuilder, 'buildProgramByFeed')
        .mockRejectedValue(new Error('Unknown error'));

      await expect(controller.generateProgramByFeed(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('notifyError', () => {
    it('should send error notification to Slack', async () => {
      const body = {
        feedId: 'feed-1',
        error: { message: 'Test error' },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      await controller.notifyError(body);

      expect(fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        }),
      );
    });

    it('should not send notification when webhook URL is not set', async () => {
      const body = {
        feedId: 'feed-1',
        error: { message: 'Test error' },
      };

      const originalWebhookUrl = appConfigService.SlackIncomingWebhookUrl;
      Object.defineProperty(appConfigService, 'SlackIncomingWebhookUrl', {
        value: '',
      });
      global.fetch = jest.fn();

      try {
        await controller.notifyError(body);
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(appConfigService, 'SlackIncomingWebhookUrl', {
          value: originalWebhookUrl,
        });
      }
    });
  });

  describe('finalize', () => {
    it('should send finalization notification to Slack', async () => {
      const body = {
        totalFeeds: 5,
        timestamp: 1234567890,
        successCount: 4,
        failedFeedIds: ['feed-5'],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      await controller.finalize(body);

      expect(fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        }),
      );
    });

    it('should not send notification when webhook URL is not set', async () => {
      const body = {
        totalFeeds: 5,
        timestamp: 1234567890,
        successCount: 4,
        failedFeedIds: ['feed-5'],
      };

      Object.defineProperty(appConfigService, 'SlackIncomingWebhookUrl', {
        value: '',
      });
      global.fetch = jest.fn();

      await controller.finalize(body);

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('RSS関連エンドポイント', () => {
    let personalRssService: any;

    beforeEach(() => {
      personalRssService = {
        generateAndUploadAllUserRss: jest.fn(),
        generateAndUploadUserRss: jest.fn(),
      };

      // PersonalRssServiceのモックを設定
      (controller as any).personalRssService = personalRssService;
    });

    describe('generateAllRss', () => {
      it('RSS一括生成が正常に完了する', async () => {
        const mockResult = {
          successCount: 5,
          failureCount: 1,
          failedUserIds: ['user-failed'],
          startedAt: new Date('2024-12-10T10:00:00Z'),
          completedAt: new Date('2024-12-10T10:05:00Z'),
        };

        personalRssService.generateAndUploadAllUserRss.mockResolvedValue(
          mockResult,
        );

        global.fetch = jest.fn().mockResolvedValue({ ok: true });

        const result = await controller.generateAllUserRss({});

        expect(
          personalRssService.generateAndUploadAllUserRss,
        ).toHaveBeenCalled();
        expect(result.successCount).toBe(5);
        expect(result.failureCount).toBe(1);
        expect(result.failedUserIds).toEqual(['user-failed']);
        expect(result.durationMs).toBe(300000); // 5分
        expect(fetch).toHaveBeenCalled(); // Slack通知が送信される
      });

      it('RSS一括生成でエラーが発生した場合はInternalServerErrorExceptionを投げる', async () => {
        personalRssService.generateAndUploadAllUserRss.mockRejectedValue(
          new Error('RSS generation failed'),
        );

        await expect(controller.generateAllUserRss({})).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });

    describe('generateUserRss', () => {
      it('個別ユーザーRSS生成が正常に完了する', async () => {
        const dto = { userId: 'user-123' };
        const mockResult = {
          userId: 'user-123',
          rssUrl: 'https://rss.techpostcast.com/u/token-123/rss.xml',
          episodeCount: 10,
          generatedAt: new Date('2024-12-10T10:00:00Z'),
        };

        personalRssService.generateAndUploadUserRss.mockResolvedValue(
          mockResult,
        );

        const result = await controller.generateUserRss(dto);

        expect(
          personalRssService.generateAndUploadUserRss,
        ).toHaveBeenCalledWith('user-123');
        expect(result.rssUrl).toBe(
          'https://rss.techpostcast.com/u/token-123/rss.xml',
        );
        expect(result.episodeCount).toBe(10);
        expect(result.generatedAt).toBe('2024-12-10T10:00:00.000Z');
      });

      it('ユーザーが見つからない場合はNotFoundExceptionを投げる', async () => {
        const dto = { userId: 'non-existent-user' };

        personalRssService.generateAndUploadUserRss.mockRejectedValue(
          new AppUserNotFoundError(
            'ユーザーが見つかりません: non-existent-user',
          ),
        );

        await expect(controller.generateUserRss(dto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('RSS生成エラーの場合はBadRequestExceptionを投げる', async () => {
        const dto = { userId: 'user-123' };

        personalRssService.generateAndUploadUserRss.mockRejectedValue(
          new RssFileGenerationError('RSS機能が無効またはトークンが未設定です'),
        );

        await expect(controller.generateUserRss(dto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('RSSアップロードエラーの場合はInternalServerErrorExceptionを投げる', async () => {
        const dto = { userId: 'user-123' };

        personalRssService.generateAndUploadUserRss.mockRejectedValue(
          new RssFileUploadError('RSS upload failed'),
        );

        await expect(controller.generateUserRss(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });

      it('その他のエラーの場合はInternalServerErrorExceptionを投げる', async () => {
        const dto = { userId: 'user-123' };

        personalRssService.generateAndUploadUserRss.mockRejectedValue(
          new Error('Unknown error'),
        );

        await expect(controller.generateUserRss(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });
});
