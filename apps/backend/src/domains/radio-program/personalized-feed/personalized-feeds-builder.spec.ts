import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../../app-config/app-config.service';
import { QiitaPostsApiClient } from '../../../infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { AppUserFactory } from '../../../test/factories/app-user.factory';
import { PersonalizedFeedFactory } from '../../../test/factories/personalized-feed.factory';
import { QiitaPostFactory } from '../../../test/factories/qiita-post.factory';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../../test/helpers/logger.helper';
import {
  InsufficientPostsError,
  PersonalizedProgramAlreadyExistsError,
  PersonalizeProgramError,
} from '../../../types/errors/personalized-program.error';
import { PersonalizedFeedFilterMapper } from './personalized-feed-filter.mapper';
import { PersonalizedFeedsBuilder } from './personalized-feeds-builder';

describe('PersonalizedFeedsBuilder', () => {
  let builder: PersonalizedFeedsBuilder;
  let appConfigService: jest.Mocked<AppConfigService>;
  let filterMapper: jest.Mocked<PersonalizedFeedFilterMapper>;
  let qiitaPostsApiClient: jest.Mocked<QiitaPostsApiClient>;
  let appUsersRepository: any;
  let personalizedFeedsRepository: any;
  let qiitaPostsRepository: any;
  let textToSpeechClient: any;
  let programFileMaker: any;
  let programFileUploader: any;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    appConfigService = {
      PersonalizedProgramTargetDir: '/tmp/test',
      ProgramAudioBucketName: 'test-bucket',
      get: jest.fn(),
    } as unknown as jest.Mocked<AppConfigService>;

    filterMapper = {
      mapToQiitaApiParams: jest.fn(),
    } as unknown as jest.Mocked<PersonalizedFeedFilterMapper>;

    qiitaPostsApiClient = {
      findQiitaPosts: jest.fn(),
    } as unknown as jest.Mocked<QiitaPostsApiClient>;

    appUsersRepository = {
      findOne: jest.fn(),
      findOneWithSubscription: jest.fn(),
    };

    personalizedFeedsRepository = {
      findOne: jest.fn(),
      findActive: jest.fn(),
      findActiveByUser: jest.fn(),
      findProgramByFeedIdAndDate: jest.fn(),
      invalidateExpiredPrograms: jest.fn(),
      createPersonalizedProgram: jest.fn(),
      addPersonalizedProgramSuccessAttempt: jest.fn(),
      addPersonalizedProgramFailureAttempt: jest.fn(),
    };

    qiitaPostsRepository = {
      upsertQiitaPosts: jest.fn(),
    };

    textToSpeechClient = {
      generatePersonalizedProgramAudioFiles: jest.fn(),
    };

    programFileMaker = {
      generatePersonalizedProgramFile: jest.fn(),
      getAudioDuration: jest.fn().mockResolvedValue(1000),
    };

    programFileUploader = {
      upload: jest.fn().mockResolvedValue('https://example.com/audio.mp3'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalizedFeedsBuilder,
        {
          provide: AppConfigService,
          useValue: appConfigService,
        },
        {
          provide: PersonalizedFeedFilterMapper,
          useValue: filterMapper,
        },
        {
          provide: QiitaPostsApiClient,
          useValue: qiitaPostsApiClient,
        },
        {
          provide: 'AppUsersRepository',
          useValue: appUsersRepository,
        },
        {
          provide: 'PersonalizedFeedsRepository',
          useValue: personalizedFeedsRepository,
        },
        {
          provide: 'QiitaPostsRepository',
          useValue: qiitaPostsRepository,
        },
        {
          provide: 'TextToSpeechClient',
          useValue: textToSpeechClient,
        },
        {
          provide: 'ProgramFileMaker',
          useValue: programFileMaker,
        },
        {
          provide: 'ProgramFileUploader',
          useValue: programFileUploader,
        },
      ],
    }).compile();

    builder = module.get<PersonalizedFeedsBuilder>(PersonalizedFeedsBuilder);
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  describe('getActiveFeeds', () => {
    it('アクティブなパーソナルフィード一覧を取得できること', async () => {
      const mockFeeds = PersonalizedFeedFactory.createPersonalizedFeeds(3);

      personalizedFeedsRepository.findActive.mockResolvedValue(mockFeeds);

      const result = await builder.getActiveFeeds();

      expect(result).toEqual(mockFeeds);
      expect(personalizedFeedsRepository.findActive).toHaveBeenCalled();
    });
  });

  describe('invalidateExpiredPrograms', () => {
    it('有効期限が過ぎたパーソナルプログラムを無効化できること', async () => {
      personalizedFeedsRepository.invalidateExpiredPrograms.mockResolvedValue(
        undefined,
      );

      await builder.invalidateExpiredPrograms();

      expect(
        personalizedFeedsRepository.invalidateExpiredPrograms,
      ).toHaveBeenCalled();
    });
  });

  describe('buildProgramByFeed', () => {
    it('指定したパーソナルフィードに基づいた番組を生成できること', async () => {
      const feedId = 'feed-1';
      const programDate = new Date();
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const mockUser = AppUserFactory.createAppUser();
      const mockPosts = QiitaPostFactory.createQiitaPostModels(3);
      const mockProgram =
        PersonalizedFeedFactory.createPersonalizedFeedProgram();

      personalizedFeedsRepository.findOne.mockResolvedValue(mockFeed);
      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedFeedsRepository.findProgramByFeedIdAndDate.mockResolvedValue(
        null,
      );

      jest.spyOn(builder, 'buildProgram').mockResolvedValue({
        program: mockProgram,
        qiitaApiRateRemaining: 100,
        qiitaApiRateReset: Date.now(),
      });

      const result = await builder.buildProgramByFeed(feedId, programDate);

      expect(result).toBeDefined();
      expect(result.program).toEqual(mockProgram);
      expect(personalizedFeedsRepository.findOne).toHaveBeenCalledWith(feedId);
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(mockFeed.userId);
      expect(
        personalizedFeedsRepository.findProgramByFeedIdAndDate,
      ).toHaveBeenCalledWith(mockFeed, programDate);
      expect(builder.buildProgram).toHaveBeenCalledWith(
        mockUser,
        mockFeed,
        programDate,
      );
    });

    it('パーソナルフィードが見つからない場合、PersonalizeProgramErrorがスローされること', async () => {
      const feedId = 'non-existent-feed';
      const programDate = new Date();
      personalizedFeedsRepository.findOne.mockResolvedValue(null);

      await expect(
        builder.buildProgramByFeed(feedId, programDate),
      ).rejects.toThrow(PersonalizeProgramError);
      expect(personalizedFeedsRepository.findOne).toHaveBeenCalledWith(feedId);
    });

    it('ユーザーが見つからない場合、PersonalizeProgramErrorがスローされること', async () => {
      const feedId = 'feed-1';
      const programDate = new Date();
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();

      personalizedFeedsRepository.findOne.mockResolvedValue(mockFeed);
      appUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        builder.buildProgramByFeed(feedId, programDate),
      ).rejects.toThrow(PersonalizeProgramError);
      expect(personalizedFeedsRepository.findOne).toHaveBeenCalledWith(feedId);
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(mockFeed.userId);
    });

    it('すでに番組が生成されている場合、PersonalizedProgramAlreadyExistsErrorがスローされること', async () => {
      const feedId = 'feed-1';
      const programDate = new Date();
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const mockUser = AppUserFactory.createAppUser();
      const mockProgram =
        PersonalizedFeedFactory.createPersonalizedFeedProgram();

      personalizedFeedsRepository.findOne.mockResolvedValue(mockFeed);
      appUsersRepository.findOne.mockResolvedValue(mockUser);
      personalizedFeedsRepository.findProgramByFeedIdAndDate.mockResolvedValue(
        mockProgram,
      );

      await expect(
        builder.buildProgramByFeed(feedId, programDate),
      ).rejects.toThrow(PersonalizedProgramAlreadyExistsError);
      expect(personalizedFeedsRepository.findOne).toHaveBeenCalledWith(feedId);
      expect(appUsersRepository.findOne).toHaveBeenCalledWith(mockFeed.userId);
      expect(
        personalizedFeedsRepository.findProgramByFeedIdAndDate,
      ).toHaveBeenCalledWith(mockFeed, programDate);
    });
  });

  describe('buildProgramByUser', () => {
    it('ユーザーのアクティブなパーソナルフィードに基づいた番組を生成できること', async () => {
      const mockUser = AppUserFactory.createAppUser();
      const programDate = new Date();
      const mockFeeds = PersonalizedFeedFactory.createPersonalizedFeeds(1);

      personalizedFeedsRepository.findActiveByUser.mockResolvedValue(mockFeeds);

      jest.spyOn(builder, 'buildProgram').mockResolvedValue({
        program: PersonalizedFeedFactory.createPersonalizedFeedProgram(),
        qiitaApiRateRemaining: 100,
        qiitaApiRateReset: Date.now(),
      });

      await builder.buildProgramByUser(mockUser, programDate);

      expect(personalizedFeedsRepository.findActiveByUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(builder.buildProgram).toHaveBeenCalledWith(
        mockUser,
        mockFeeds[0],
        programDate,
      );
    });

    it('アクティブなパーソナルフィードが見つからない場合、処理を終了すること', async () => {
      const mockUser = AppUserFactory.createAppUser();
      const programDate = new Date();

      personalizedFeedsRepository.findActiveByUser.mockResolvedValue([]);

      const buildProgramSpy = jest.spyOn(builder, 'buildProgram');

      await builder.buildProgramByUser(mockUser, programDate);

      expect(personalizedFeedsRepository.findActiveByUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(buildProgramSpy).not.toHaveBeenCalled();
    });
  });

  describe('buildProgram', () => {
    it('記事が不足している場合、InsufficientPostsErrorがスローされること', async () => {
      const mockUser = AppUserFactory.createAppUser();
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const programDate = new Date();
      const mockUserWithSubscription = {
        ...mockUser,
        subscriptions: [
          {
            id: 'sub-1',
            status: 'ACTIVE',
            planId: 'plan-1',
            plan: { id: 'plan-1', name: 'Basic Plan' },
          },
        ],
      };

      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );

      jest
        .spyOn(builder, 'generatePersonalizedProgramScript')
        .mockRejectedValue(new InsufficientPostsError('記事が不足しています'));

      personalizedFeedsRepository.addPersonalizedProgramFailureAttempt.mockResolvedValue(
        {
          id: 'attempt-1',
          feedId: mockFeed.id,
          userId: mockUser.id,
          programDate,
          postsCount: 0,
          reason: 'NOT_ENOUGH_POSTS',
          createdAt: new Date(),
        },
      );

      await expect(
        builder.buildProgram(mockUser, mockFeed, programDate),
      ).rejects.toThrow(InsufficientPostsError);
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(builder.generatePersonalizedProgramScript).toHaveBeenCalled();
      expect(
        personalizedFeedsRepository.addPersonalizedProgramFailureAttempt,
      ).toHaveBeenCalled();
    });

    it('正常に番組を生成できること', async () => {
      const mockUser = AppUserFactory.createAppUser();
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const programDate = new Date();
      const mockUserWithSubscription = {
        ...mockUser,
        subscriptions: [
          {
            id: 'sub-1',
            status: 'ACTIVE',
            planId: 'plan-1',
            plan: { id: 'plan-1', name: 'Basic Plan' },
          },
        ],
      };
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockProgram =
        PersonalizedFeedFactory.createPersonalizedFeedProgram();

      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );

      jest
        .spyOn(builder, 'generatePersonalizedProgramScript')
        .mockResolvedValue({
          script: {
            title: 'Test Program',
            opening: 'Test opening',
            posts: [],
            ending: 'Test ending',
          },
          posts: mockPosts,
          qiitaApiRateRemaining: 100,
          qiitaApiRateReset: Date.now(),
        });

      jest
        .spyOn(builder, 'generatePersonalizedProgramAudioFiles')
        .mockResolvedValue({
          openingAudioFilePath: '/tmp/opening.mp3',
          postExplanationAudioFilePaths: [
            {
              introAudioFilePath: '/tmp/intro1.mp3',
              explanationAudioFilePath: '/tmp/explanation1.mp3',
              summaryAudioFilePath: '/tmp/summary1.mp3',
            },
          ],
          endingAudioFilePath: '/tmp/ending.mp3',
        });

      jest.spyOn(builder, 'generateProgramFiles').mockResolvedValue({
        audioFileName: 'program.mp3',
        audioFilePath: '/tmp/program.mp3',
        audioDuration: 300,
        script: {
          title: 'Test Program',
          opening: 'Test opening',
          posts: [],
          ending: 'Test ending',
        },
        chapters: [],
      });

      qiitaPostsRepository.upsertQiitaPosts.mockResolvedValue(mockPosts);
      personalizedFeedsRepository.createPersonalizedProgram.mockResolvedValue(
        mockProgram,
      );
      personalizedFeedsRepository.addPersonalizedProgramSuccessAttempt.mockResolvedValue(
        {
          id: 'attempt-1',
          feedId: mockFeed.id,
          userId: mockUser.id,
          programDate,
          postsCount: 3,
          programId: mockProgram.id,
          createdAt: new Date(),
        },
      );

      const result = await builder.buildProgram(
        mockUser,
        mockFeed,
        programDate,
      );

      expect(result).toBeDefined();
      expect(result.program).toEqual(mockProgram);
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(builder.generatePersonalizedProgramScript).toHaveBeenCalled();
      expect(builder.generatePersonalizedProgramAudioFiles).toHaveBeenCalled();
      expect(builder.generateProgramFiles).toHaveBeenCalled();
      expect(programFileUploader.upload).toHaveBeenCalled();
      expect(qiitaPostsRepository.upsertQiitaPosts).toHaveBeenCalled();
      expect(
        personalizedFeedsRepository.createPersonalizedProgram,
      ).toHaveBeenCalled();
      expect(
        personalizedFeedsRepository.addPersonalizedProgramSuccessAttempt,
      ).toHaveBeenCalled();
    });
  });
});
