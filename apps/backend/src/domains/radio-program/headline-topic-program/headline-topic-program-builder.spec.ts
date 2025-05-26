import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { AppConfigService } from '../../../app-config/app-config.service';
import { HeadlineTopicProgramsRepository } from '../../../infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { QiitaPostsRepository } from '../../../infrastructure/database/qiita-posts/qiita-posts.repository';
import { OpenAiApiClient } from '../../../infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '../../../infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { HeadlineTopicProgramFactory } from '../../../test/factories/headline-topic-program.factory';
import { QiitaPostFactory } from '../../../test/factories/qiita-post.factory';
import {
  restoreLogOutput,
  suppressLogOutput,
} from '../../../test/helpers/logger.helper';
import {
  HeadlineTopicProgramError,
  HeadlineTopicProgramRegenerateError,
} from '../../../types/errors/headline-topic-program.error';
import { HeadlineTopicProgramBuilder } from './headline-topic-program-builder';
import { HeadlineTopicProgramScript, ProgramRegenerationType } from './index';

describe('HeadlineTopicProgramBuilder', () => {
  let builder: HeadlineTopicProgramBuilder;
  let appConfigService: jest.Mocked<AppConfigService>;
  let qiitaPostsApiClient: jest.Mocked<QiitaPostsApiClient>;
  let openAiApiClient: jest.Mocked<OpenAiApiClient>;
  let qiitaPostsRepository: any;
  let headlineTopicProgramsRepository: any;
  let listenerLettersRepository: any;
  let textToSpeechClient: any;
  let programFileMaker: any;
  let programFileUploader: any;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    appConfigService = {
      HeadlineTopicProgramTargetDir: '/tmp/test',
      OpenAiApiKey: 'test-api-key',
      OpenAiModel: 'gpt-4',
      get: jest.fn(),
    } as unknown as jest.Mocked<AppConfigService>;

    qiitaPostsApiClient = {
      findQiitaPostsByTags: jest.fn(),
    } as unknown as jest.Mocked<QiitaPostsApiClient>;

    openAiApiClient = {
      generateHeadlineTopicProgramScript: jest.fn(),
      summarizePost: jest.fn(),
      vectorizeHeadlineTopicProgramScript: jest.fn().mockResolvedValue({
        model: 'text-embedding-ada-002',
        vector: [0.1, 0.2, 0.3],
        totalTokens: 3,
      }),
    } as unknown as jest.Mocked<OpenAiApiClient>;

    qiitaPostsRepository = {
      upsertQiitaPosts: jest.fn(),
      findWithBodyByIds: jest.fn(),
    };

    headlineTopicProgramsRepository = {
      createHeadlineTopicProgram: jest.fn(),
      updateHeadlineTopicProgram: jest.fn(),
      findOne: jest.fn(),
      setHeadlineTopicProgramScriptVector: jest.fn(),
    };

    listenerLettersRepository = {
      findUnintroduced: jest.fn(),
      findIntroduced: jest.fn(),
      updateAsIntroduced: jest.fn(),
    };

    textToSpeechClient = {
      generateHeadlineTopicProgramAudioFiles: jest.fn(),
    };

    programFileMaker = {
      generateProgramAudioFile: jest.fn(),
      getAudioDuration: jest.fn().mockResolvedValue(1000),
    };

    programFileUploader = {
      upload: jest.fn().mockResolvedValue('https://example.com/audio.mp3'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeadlineTopicProgramBuilder,
        {
          provide: AppConfigService,
          useValue: appConfigService,
        },
        {
          provide: QiitaPostsApiClient,
          useValue: qiitaPostsApiClient,
        },
        {
          provide: OpenAiApiClient,
          useValue: openAiApiClient,
        },
        {
          provide: QiitaPostsRepository,
          useValue: qiitaPostsRepository,
        },
        {
          provide: HeadlineTopicProgramsRepository,
          useValue: headlineTopicProgramsRepository,
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
        {
          provide: 'ListenerLettersRepository',
          useValue: listenerLettersRepository,
        },
      ],
    }).compile();

    builder = module.get<HeadlineTopicProgramBuilder>(
      HeadlineTopicProgramBuilder,
    );
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(builder).toBeDefined();
  });

  describe('buildProgram', () => {
    it('番組を正常に生成できること', async () => {
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockScript: HeadlineTopicProgramScript = {
        title: 'テスト番組',
        intro: 'イントロダクション',
        posts: mockPosts.map((post) => ({
          postId: post.id,
          title: post.title,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };
      const mockAudioFiles = {
        openingAudioFilePath: '/tmp/opening.mp3',
        postAudioFilePaths: [
          '/tmp/post1.mp3',
          '/tmp/post2.mp3',
          '/tmp/post3.mp3',
        ],
        postIntroductionAudioFilePaths: [
          '/tmp/intro1.mp3',
          '/tmp/intro2.mp3',
          '/tmp/intro3.mp3',
        ],
        endingAudioFilePath: '/tmp/ending.mp3',
      };
      const mockGenerateResult =
        HeadlineTopicProgramFactory.createProgramGenerateResult();
      const mockUploadResult =
        HeadlineTopicProgramFactory.createProgramUploadResult();
      const mockProgram1 =
        HeadlineTopicProgramFactory.createHeadlineTopicProgram();

      // Mock the necessary repository methods
      listenerLettersRepository.findUnintroduced.mockResolvedValue(null);

      jest.spyOn(builder, 'summarizePosts').mockResolvedValue(mockPosts);

      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(
        mockScript,
      );
      textToSpeechClient.generateHeadlineTopicProgramAudioFiles.mockResolvedValue(
        mockAudioFiles,
      );
      programFileMaker.generateProgramAudioFile.mockResolvedValue(
        mockGenerateResult,
      );
      programFileUploader.upload.mockResolvedValue(mockUploadResult.audioUrl);
      qiitaPostsRepository.upsertQiitaPosts.mockResolvedValue(mockPosts);
      headlineTopicProgramsRepository.createHeadlineTopicProgram.mockResolvedValue(
        mockProgram1,
      );

      const result = await builder.buildProgram(new Date(), mockPosts);

      expect(result).toBeDefined();
      expect(result).toEqual(mockProgram1);
      expect(builder.summarizePosts).toHaveBeenCalledWith(mockPosts);
      expect(
        openAiApiClient.generateHeadlineTopicProgramScript,
      ).toHaveBeenCalled();
      expect(
        textToSpeechClient.generateHeadlineTopicProgramAudioFiles,
      ).toHaveBeenCalled();
      expect(programFileMaker.generateProgramAudioFile).toHaveBeenCalled();
      expect(programFileUploader.upload).toHaveBeenCalled();
      expect(qiitaPostsRepository.upsertQiitaPosts).toHaveBeenCalled();
      expect(
        headlineTopicProgramsRepository.createHeadlineTopicProgram,
      ).toHaveBeenCalled();
    });

    it('記事取得でエラーが発生した場合、ProgramGenerationErrorがスローされること', async () => {
      const error = new Error('記事取得エラー');
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);

      jest
        .spyOn(builder, 'summarizePosts')
        .mockRejectedValue(new HeadlineTopicProgramError('記事要約エラー'));

      await expect(builder.buildProgram(new Date(), mockPosts)).rejects.toThrow(
        HeadlineTopicProgramError,
      );
      expect(builder.summarizePosts).toHaveBeenCalledWith(mockPosts);
    });
  });

  describe('regenerateProgram', () => {
    it('番組を正常に再生成できること', async () => {
      const programId = 'program-1';
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockScript: HeadlineTopicProgramScript = {
        title: 'テスト番組',
        intro: 'イントロダクション',
        posts: mockPosts.map((post) => ({
          postId: post.id,
          title: post.title,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };
      const mockAudioFiles = {
        openingAudioFilePath: '/tmp/opening.mp3',
        postAudioFilePaths: [
          '/tmp/post1.mp3',
          '/tmp/post2.mp3',
          '/tmp/post3.mp3',
        ],
        postIntroductionAudioFilePaths: [
          '/tmp/intro1.mp3',
          '/tmp/intro2.mp3',
          '/tmp/intro3.mp3',
        ],
        endingAudioFilePath: '/tmp/ending.mp3',
      };
      const mockGenerateResult =
        HeadlineTopicProgramFactory.createProgramGenerateResult();
      const mockUploadResult =
        HeadlineTopicProgramFactory.createProgramUploadResult();
      const mockProgram2 =
        HeadlineTopicProgramFactory.createHeadlineTopicProgram();

      // Mock the necessary repository methods
      qiitaPostsRepository.findWithBodyByIds.mockResolvedValue(mockPosts);
      listenerLettersRepository.findIntroduced.mockResolvedValue(null);

      jest.spyOn(builder, 'summarizePosts').mockResolvedValue(mockPosts);

      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(
        mockScript,
      );
      textToSpeechClient.generateHeadlineTopicProgramAudioFiles.mockResolvedValue(
        mockAudioFiles,
      );
      programFileMaker.generateProgramAudioFile.mockResolvedValue(
        mockGenerateResult,
      );
      programFileUploader.upload.mockResolvedValue(mockUploadResult.audioUrl);
      headlineTopicProgramsRepository.updateHeadlineTopicProgram.mockResolvedValue(
        mockProgram2,
      );

      const regenerationType: ProgramRegenerationType = 'SCRIPT_AND_AUDIO';
      const mockProgramWithPosts = {
        id: programId,
        title: 'テスト番組',
        createdAt: new Date(),
        updatedAt: new Date(),
        audioUrl: 'https://example.com/audio.mp3',
        audioDuration: 300,
        isActive: true,
        posts: mockPosts,
      } as unknown as HeadlineTopicProgramWithQiitaPosts;
      const result = await builder.regenerateProgram(
        mockProgramWithPosts,
        regenerationType,
      );

      expect(result).toBeDefined();
      expect(result).toEqual(mockProgram2);
      expect(qiitaPostsRepository.findWithBodyByIds).toHaveBeenCalled();
      expect(builder.summarizePosts).toHaveBeenCalled();
      expect(
        openAiApiClient.generateHeadlineTopicProgramScript,
      ).toHaveBeenCalled();
      expect(
        textToSpeechClient.generateHeadlineTopicProgramAudioFiles,
      ).toHaveBeenCalled();
      expect(programFileMaker.generateProgramAudioFile).toHaveBeenCalled();
      expect(programFileUploader.upload).toHaveBeenCalled();
      expect(
        headlineTopicProgramsRepository.updateHeadlineTopicProgram,
      ).toHaveBeenCalled();
    });

    it('再生成種別が指定されていない場合、ProgramRegenerationErrorがスローされること', async () => {
      const programId = 'test-program';

      const mockProgram = {
        id: programId,
        title: 'テスト番組',
        createdAt: new Date(),
        updatedAt: new Date(),
        audioUrl: 'https://example.com/audio.mp3',
        audioDuration: 300,
        isActive: true,
        posts: [],
      } as unknown as HeadlineTopicProgramWithQiitaPosts;

      await expect(
        builder.regenerateProgram(mockProgram, null as any),
      ).rejects.toThrow(HeadlineTopicProgramRegenerateError);
    });
  });

  describe('summarizePosts', () => {
    it('記事を正常に要約できること', async () => {
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockScript: HeadlineTopicProgramScript = {
        title: 'テスト番組',
        intro: 'イントロダクション',
        posts: mockPosts.map((post) => ({
          postId: post.id,
          title: post.title,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };

      openAiApiClient.summarizePost = jest.fn().mockImplementation((post) => {
        return { summary: `${post.title}のまとめ` };
      });
      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(
        mockScript,
      );

      const result = await builder.summarizePosts(mockPosts);

      expect(result).toBeDefined();
      expect(openAiApiClient.summarizePost).toHaveBeenCalled();
    });
  });

  describe('generateScript', () => {
    it('台本を正常に生成できること', async () => {
      const mockPosts = QiitaPostFactory.createQiitaPostApiResponses(3);
      const mockScript: HeadlineTopicProgramScript = {
        title: 'テスト番組',
        intro: 'イントロダクション',
        posts: mockPosts.map((post) => ({
          postId: post.id,
          title: post.title,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };

      qiitaPostsApiClient.findQiitaPostsByTags.mockResolvedValue({
        posts: mockPosts,
        maxPage: 1,
        rateRemaining: 100,
        rateReset: Date.now(),
      });
      openAiApiClient.summarizePost = jest.fn().mockImplementation((post) => {
        return { summary: `${post.title}のまとめ` };
      });
      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(
        mockScript,
      );

      jest.spyOn(builder, 'summarizePosts').mockResolvedValue(mockPosts);

      const result = await builder.generateScript(
        new Date(),
        mockPosts,
        undefined,
      );

      expect(result).toBeDefined();
      expect(result).toEqual(mockScript);
      expect(
        openAiApiClient.generateHeadlineTopicProgramScript,
      ).toHaveBeenCalled();
    });
  });
});
