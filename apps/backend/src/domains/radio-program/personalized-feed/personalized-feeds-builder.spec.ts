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
  PersonalizedProgramUploadError,
  PersonalizeProgramError,
} from '../../../types/errors/personalized-program.error';
import { PersonalizedFeedFilterMapper } from './personalized-feed-filter.mapper';
import { PersonalizedFeedsBuilder } from './personalized-feeds-builder';

// テストデータの一貫性を保つためのヘルパー関数
class TestDataHelper {
  static createMockScript() {
    return {
      title: 'Test Program',
      opening: 'Test opening',
      posts: [],
      ending: 'Test ending',
    };
  }

  static createMockAudioFilesResult() {
    return {
      openingAudioFilePath: '/tmp/opening.mp3',
      postExplanationAudioFilePaths: [
        {
          introAudioFilePath: '/tmp/intro1.mp3',
          explanationAudioFilePath: '/tmp/explanation1.mp3',
          summaryAudioFilePath: '/tmp/summary1.mp3',
        },
      ],
      endingAudioFilePath: '/tmp/ending.mp3',
    };
  }

  static createMockProgramFilesResult() {
    return {
      audioFileName: 'program.mp3',
      audioFilePath: '/tmp/program.mp3',
      audioDuration: 300,
      script: this.createMockScript(),
      chapters: [],
    };
  }

  static createMockUserWithSubscription(user: any) {
    return {
      ...user,
      subscriptions: [
        {
          id: 'sub-1',
          status: 'ACTIVE',
          planId: 'plan-1',
          plan: { id: 'plan-1', name: 'Basic Plan' },
        },
      ],
    };
  }

  static createMockScriptGenerationResult(posts: any[]) {
    return {
      script: this.createMockScript(),
      posts,
      qiitaApiRateRemaining: 100,
      qiitaApiRateReset: Date.now(),
    };
  }
}

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

    it('アクティブなフィードが存在しない場合、空配列を返すこと', async () => {
      personalizedFeedsRepository.findActive.mockResolvedValue([]);

      const result = await builder.getActiveFeeds();

      expect(result).toEqual([]);
      expect(personalizedFeedsRepository.findActive).toHaveBeenCalled();
    });

    it('リポジトリでエラーが発生した場合、エラーが伝播されること', async () => {
      const error = new Error('Database connection failed');
      personalizedFeedsRepository.findActive.mockRejectedValue(error);

      await expect(builder.getActiveFeeds()).rejects.toThrow(
        'Database connection failed',
      );
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

    it('無効化処理でエラーが発生した場合、エラーが伝播されること', async () => {
      const error = new Error('Invalidation failed');
      personalizedFeedsRepository.invalidateExpiredPrograms.mockRejectedValue(
        error,
      );

      await expect(builder.invalidateExpiredPrograms()).rejects.toThrow(
        'Invalidation failed',
      );
      expect(
        personalizedFeedsRepository.invalidateExpiredPrograms,
      ).toHaveBeenCalled();
    });
  });

  describe('buildProgramByFeed', () => {
    const feedId = 'feed-1';
    const programDate = new Date('2024-01-01');

    it('指定したパーソナルフィードに基づいた番組を生成できること', async () => {
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const mockUser = AppUserFactory.createAppUser();
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
      personalizedFeedsRepository.findOne.mockResolvedValue(null);

      await expect(
        builder.buildProgramByFeed(feedId, programDate),
      ).rejects.toThrow(PersonalizeProgramError);
      expect(personalizedFeedsRepository.findOne).toHaveBeenCalledWith(feedId);
    });

    it('ユーザーが見つからない場合、PersonalizeProgramErrorがスローされること', async () => {
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

    it('空のフィードIDが渡された場合、適切にエラーハンドリングされること', async () => {
      personalizedFeedsRepository.findOne.mockResolvedValue(null);

      await expect(builder.buildProgramByFeed('', programDate)).rejects.toThrow(
        PersonalizeProgramError,
      );
      expect(personalizedFeedsRepository.findOne).toHaveBeenCalledWith('');
    });

    it('無効な日付が渡された場合でも処理が継続されること', async () => {
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const mockUser = AppUserFactory.createAppUser();
      const mockProgram =
        PersonalizedFeedFactory.createPersonalizedFeedProgram();
      const invalidDate = new Date('invalid');

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

      const result = await builder.buildProgramByFeed(feedId, invalidDate);

      expect(result).toBeDefined();
      expect(
        personalizedFeedsRepository.findProgramByFeedIdAndDate,
      ).toHaveBeenCalledWith(mockFeed, invalidDate);
    });
  });

  describe('buildProgramByUser', () => {
    const mockUser = AppUserFactory.createAppUser();
    const programDate = new Date('2024-01-01');

    it('ユーザーのアクティブなパーソナルフィードに基づいた番組を生成できること', async () => {
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
      personalizedFeedsRepository.findActiveByUser.mockResolvedValue([]);

      const buildProgramSpy = jest.spyOn(builder, 'buildProgram');

      await builder.buildProgramByUser(mockUser, programDate);

      expect(personalizedFeedsRepository.findActiveByUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(buildProgramSpy).not.toHaveBeenCalled();
    });

    it('複数のアクティブなフィードがある場合、最初のフィードのみ処理されること', async () => {
      const mockFeeds = PersonalizedFeedFactory.createPersonalizedFeeds(3);

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
      expect(builder.buildProgram).toHaveBeenCalledTimes(1);
      expect(builder.buildProgram).toHaveBeenCalledWith(
        mockUser,
        mockFeeds[0],
        programDate,
      );
    });

    it('buildProgramでエラーが発生した場合、PersonalizeProgramErrorがスローされること', async () => {
      const mockFeeds = PersonalizedFeedFactory.createPersonalizedFeeds(1);
      const error = new Error('Build program failed');

      personalizedFeedsRepository.findActiveByUser.mockResolvedValue(mockFeeds);
      jest.spyOn(builder, 'buildProgram').mockRejectedValue(error);

      await expect(
        builder.buildProgramByUser(mockUser, programDate),
      ).rejects.toThrow(PersonalizeProgramError);
      expect(personalizedFeedsRepository.findActiveByUser).toHaveBeenCalledWith(
        mockUser,
      );
      expect(builder.buildProgram).toHaveBeenCalledWith(
        mockUser,
        mockFeeds[0],
        programDate,
      );
    });
  });

  describe('buildProgram', () => {
    const mockUser = AppUserFactory.createAppUser();
    const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
    const programDate = new Date('2024-01-01');

    it('記事が不足している場合、InsufficientPostsErrorがスローされること', async () => {
      const mockUserWithSubscription =
        TestDataHelper.createMockUserWithSubscription(mockUser);

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
      const mockUserWithSubscription =
        TestDataHelper.createMockUserWithSubscription(mockUser);
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockProgram =
        PersonalizedFeedFactory.createPersonalizedFeedProgram();

      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );

      jest
        .spyOn(builder, 'generatePersonalizedProgramScript')
        .mockResolvedValue(
          TestDataHelper.createMockScriptGenerationResult(mockPosts),
        );

      jest
        .spyOn(builder, 'generatePersonalizedProgramAudioFiles')
        .mockResolvedValue(TestDataHelper.createMockAudioFilesResult());

      jest
        .spyOn(builder, 'generateProgramFiles')
        .mockResolvedValue(TestDataHelper.createMockProgramFilesResult());

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

    it('サブスクリプションが見つからない場合、PersonalizedProgramUploadErrorがスローされること', async () => {
      const mockUserWithoutSubscription = {
        ...mockUser,
        subscriptions: [],
      };

      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithoutSubscription,
      );

      personalizedFeedsRepository.addPersonalizedProgramFailureAttempt.mockResolvedValue(
        {
          id: 'attempt-1',
          feedId: mockFeed.id,
          userId: mockUser.id,
          programDate,
          postsCount: 0,
          reason: 'OTHER',
          createdAt: new Date(),
        },
      );

      await expect(
        builder.buildProgram(mockUser, mockFeed, programDate),
      ).rejects.toThrow(PersonalizedProgramUploadError);
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(
        personalizedFeedsRepository.addPersonalizedProgramFailureAttempt,
      ).toHaveBeenCalled();
    });

    it('音声ファイル生成でエラーが発生した場合、適切にエラーハンドリングされること', async () => {
      const mockUserWithSubscription =
        TestDataHelper.createMockUserWithSubscription(mockUser);
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const error = new Error('Audio generation failed');

      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );

      jest
        .spyOn(builder, 'generatePersonalizedProgramScript')
        .mockResolvedValue(
          TestDataHelper.createMockScriptGenerationResult(mockPosts),
        );

      jest
        .spyOn(builder, 'generatePersonalizedProgramAudioFiles')
        .mockRejectedValue(error);

      personalizedFeedsRepository.addPersonalizedProgramFailureAttempt.mockResolvedValue(
        {
          id: 'attempt-1',
          feedId: mockFeed.id,
          userId: mockUser.id,
          programDate,
          postsCount: 0,
          reason: 'OTHER',
          createdAt: new Date(),
        },
      );

      await expect(
        builder.buildProgram(mockUser, mockFeed, programDate),
      ).rejects.toThrow(PersonalizeProgramError);
      expect(builder.generatePersonalizedProgramScript).toHaveBeenCalled();
      expect(builder.generatePersonalizedProgramAudioFiles).toHaveBeenCalled();
      expect(
        personalizedFeedsRepository.addPersonalizedProgramFailureAttempt,
      ).toHaveBeenCalled();
    });

    it('ファイルアップロードでエラーが発生した場合、適切にエラーハンドリングされること', async () => {
      const mockUserWithSubscription =
        TestDataHelper.createMockUserWithSubscription(mockUser);
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const uploadError = new PersonalizedProgramUploadError('Upload failed');

      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );

      jest
        .spyOn(builder, 'generatePersonalizedProgramScript')
        .mockResolvedValue(
          TestDataHelper.createMockScriptGenerationResult(mockPosts),
        );

      jest
        .spyOn(builder, 'generatePersonalizedProgramAudioFiles')
        .mockResolvedValue(TestDataHelper.createMockAudioFilesResult());

      jest
        .spyOn(builder, 'generateProgramFiles')
        .mockResolvedValue(TestDataHelper.createMockProgramFilesResult());

      // uploadProgramFilesメソッドをモックしてエラーを発生させる
      jest.spyOn(builder, 'uploadProgramFiles').mockRejectedValue(uploadError);

      personalizedFeedsRepository.addPersonalizedProgramFailureAttempt.mockResolvedValue(
        {
          id: 'attempt-1',
          feedId: mockFeed.id,
          userId: mockUser.id,
          programDate,
          postsCount: 0,
          reason: 'UPLOAD_ERROR',
          createdAt: new Date(),
        },
      );

      await expect(
        builder.buildProgram(mockUser, mockFeed, programDate),
      ).rejects.toThrow(PersonalizedProgramUploadError);
      expect(
        personalizedFeedsRepository.addPersonalizedProgramFailureAttempt,
      ).toHaveBeenCalled();
    });
  });

  describe('filterPostsByLikesCount', () => {
    it('最小いいね数でフィルタリングできること', async () => {
      const posts = QiitaPostFactory.createQiitaPostApiResponses(5);
      // いいね数を設定
      posts[0].likes_count = 10;
      posts[1].likes_count = 5;
      posts[2].likes_count = 15;
      posts[3].likes_count = 3;
      posts[4].likes_count = 8;

      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed({
        filterGroups: [
          {
            id: 'group-1',
            filterId: 'feed-1',
            name: 'Test Group',
            logicType: 'OR',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [],
            likesCountFilters: [
              {
                id: 'likes-filter-1',
                groupId: 'group-1',
                minLikes: 8,
                createdAt: new Date(),
              },
            ],
          },
        ],
      });

      const result = builder.filterPostsByLikesCount(posts, mockFeed);

      expect(result).toHaveLength(3);
      expect(result.map((p) => p.likes_count)).toEqual([10, 15, 8]);
    });

    it('最小いいね数が0以下の場合、すべての記事が返されること', async () => {
      const posts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed({
        filterGroups: [
          {
            id: 'group-1',
            filterId: 'feed-1',
            name: 'Test Group',
            logicType: 'OR',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [],
            likesCountFilters: [
              {
                id: 'likes-filter-1',
                groupId: 'group-1',
                minLikes: 0,
                createdAt: new Date(),
              },
            ],
          },
        ],
      });

      const result = builder.filterPostsByLikesCount(posts, mockFeed);

      expect(result).toEqual(posts);
    });

    it('空の記事配列が渡された場合、空配列が返されること', async () => {
      const posts: any[] = [];
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed({
        filterGroups: [
          {
            id: 'group-1',
            filterId: 'feed-1',
            name: 'Test Group',
            logicType: 'OR',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [],
            likesCountFilters: [
              {
                id: 'likes-filter-1',
                groupId: 'group-1',
                minLikes: 5,
                createdAt: new Date(),
              },
            ],
          },
        ],
      });

      const result = builder.filterPostsByLikesCount(posts, mockFeed);

      expect(result).toEqual([]);
    });

    it('フィルターグループが存在しない場合、すべての記事が返されること', async () => {
      const posts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed(); // filterGroups: []

      const result = builder.filterPostsByLikesCount(posts, mockFeed);

      expect(result).toEqual(posts);
    });

    it('いいね数フィルターが存在しない場合、すべての記事が返されること', async () => {
      const posts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed({
        filterGroups: [
          {
            id: 'group-1',
            filterId: 'feed-1',
            name: 'Test Group',
            logicType: 'OR',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [],
            likesCountFilters: [], // 空配列
          },
        ],
      });

      const result = builder.filterPostsByLikesCount(posts, mockFeed);

      expect(result).toEqual(posts);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のフィードを処理する際のパフォーマンスが適切であること', async () => {
      const startTime = Date.now();
      const mockFeeds = PersonalizedFeedFactory.createPersonalizedFeeds(100);

      personalizedFeedsRepository.findActive.mockResolvedValue(mockFeeds);

      const result = await builder.getActiveFeeds();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // 1秒以内
    });

    it('大量の記事をフィルタリングする際のパフォーマンスが適切であること', async () => {
      const startTime = Date.now();
      const posts = QiitaPostFactory.createQiitaPostApiResponses(1000);
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed({
        filterGroups: [
          {
            id: 'group-1',
            filterId: 'feed-1',
            name: 'Test Group',
            logicType: 'OR',
            createdAt: new Date(),
            updatedAt: new Date(),
            tagFilters: [],
            authorFilters: [],
            dateRangeFilters: [],
            likesCountFilters: [
              {
                id: 'likes-filter-1',
                groupId: 'group-1',
                minLikes: 5,
                createdAt: new Date(),
              },
            ],
          },
        ],
      });

      const result = builder.filterPostsByLikesCount(posts, mockFeed);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(500); // 500ms以内
    });
  });

  describe('統合テスト', () => {
    it('番組生成の全体フローが正常に動作すること', async () => {
      const mockUser = AppUserFactory.createAppUser();
      const mockFeed = PersonalizedFeedFactory.createPersonalizedFeed();
      const programDate = new Date('2024-01-01');
      const mockUserWithSubscription =
        TestDataHelper.createMockUserWithSubscription(mockUser);
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockProgram =
        PersonalizedFeedFactory.createPersonalizedFeedProgram();

      // 全ての依存関係をモック
      appUsersRepository.findOneWithSubscription.mockResolvedValue(
        mockUserWithSubscription,
      );
      jest
        .spyOn(builder, 'generatePersonalizedProgramScript')
        .mockResolvedValue(
          TestDataHelper.createMockScriptGenerationResult(mockPosts),
        );
      jest
        .spyOn(builder, 'generatePersonalizedProgramAudioFiles')
        .mockResolvedValue(TestDataHelper.createMockAudioFilesResult());
      jest
        .spyOn(builder, 'generateProgramFiles')
        .mockResolvedValue(TestDataHelper.createMockProgramFilesResult());
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

      // 結果の検証
      expect(result).toBeDefined();
      expect(result.program).toEqual(mockProgram);
      expect(result.qiitaApiRateRemaining).toBe(100);

      // 全ての処理が正しく呼ばれたことを確認
      expect(appUsersRepository.findOneWithSubscription).toHaveBeenCalled();
      expect(builder.generatePersonalizedProgramScript).toHaveBeenCalled();
      expect(builder.generatePersonalizedProgramAudioFiles).toHaveBeenCalled();
      expect(builder.generateProgramFiles).toHaveBeenCalled();
    });
  });
});
