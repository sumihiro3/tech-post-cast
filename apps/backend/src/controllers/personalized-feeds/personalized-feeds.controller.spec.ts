import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { AppConfigService } from '../../app-config/app-config.service';
import {
  AppUserNotFoundError,
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAlreadyExistsError,
} from '../../types/errors';
import { PersonalizedFeedsBuilder } from '../../domains/radio-program/personalized-feed/personalized-feeds-builder';
import {
  ActiveFeedDto,
  GenerateProgramResponseDto,
  PersonalizedFeedCreateRequestDto,
} from './dto/personalized-feed.dto';
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
          filterGroups: [
            {
              id: 'group-1',
              name: 'Group 1',
              tagFilters: [],
              authorFilters: [],
              dateRangeFilters: [],
              likesCountFilters: [],
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-1',
          isActive: true,
        },
        { 
          id: 'feed-2',
          name: 'Feed 2',
          description: 'Test feed 2',
          filterGroups: [
            {
              id: 'group-2',
              name: 'Group 2',
              tagFilters: [],
              authorFilters: [],
              dateRangeFilters: [],
              likesCountFilters: [],
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-1',
          isActive: true,
        },
      ];
      
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
          script: '{}',
          chapters: '[]',
          expiresAt: new Date(),
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
        .mockRejectedValue(new PersonalizedFeedNotFoundError('Feed not found', 'feed-id'));

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
        .mockRejectedValue(new AppUserNotFoundError('User not found', 'user-id'));

      await expect(controller.generateProgramByFeed(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when PersonalizedProgramAlreadyExistsError is thrown', async () => {
      const dto = new PersonalizedFeedCreateRequestDto();
      dto.feedId = 'feed-1';
      dto.daysAgo = 0;

      jest
        .spyOn(personalizedFeedsBuilder, 'buildProgramByFeed')
        .mockRejectedValue(
          new PersonalizedProgramAlreadyExistsError('Program already exists', 'feed-id', new Date()),
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

      jest.spyOn(appConfigService, 'SlackIncomingWebhookUrl', 'get').mockReturnValue('');
      global.fetch = jest.fn();

      await controller.notifyError(body);

      expect(fetch).not.toHaveBeenCalled();
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

      jest.spyOn(appConfigService, 'SlackIncomingWebhookUrl', 'get').mockReturnValue('');
      global.fetch = jest.fn();

      await controller.finalize(body);

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
