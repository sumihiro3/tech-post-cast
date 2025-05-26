import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramBuilder } from './headline-topic-program-builder';
import { AppConfigService } from '../../../app-config/app-config.service';
import { QiitaPostsApiClient } from '../../../infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { OpenAiApiClient } from '../../../infrastructure/external-api/openai-api/openai-api.client';
import { HeadlineTopicProgramFactory } from '../../../test/factories/headline-topic-program.factory';
import { QiitaPostFactory } from '../../../test/factories/qiita-post.factory';
import { suppressLogOutput, restoreLogOutput } from '../../../test/helpers/logger.helper';
import { HeadlineTopicProgramError, HeadlineTopicProgramRegenerateError } from '../../../types/errors/headline-topic-program.error';

describe('HeadlineTopicProgramBuilder', () => {
  let builder: HeadlineTopicProgramBuilder;
  let appConfigService: jest.Mocked<AppConfigService>;
  let qiitaPostsApiClient: jest.Mocked<QiitaPostsApiClient>;
  let openAiApiClient: jest.Mocked<OpenAiApiClient>;
  let qiitaPostsRepository: any;
  let headlineTopicProgramsRepository: any;
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
      findQiitaPosts: jest.fn(),
    } as unknown as jest.Mocked<QiitaPostsApiClient>;

    openAiApiClient = {
      generateHeadlineTopicProgramScript: jest.fn(),
    } as unknown as jest.Mocked<OpenAiApiClient>;

    qiitaPostsRepository = {
      upsertQiitaPosts: jest.fn(),
    };

    headlineTopicProgramsRepository = {
      createHeadlineTopicProgram: jest.fn(),
      updateHeadlineTopicProgram: jest.fn(),
    };

    textToSpeechClient = {
      generateHeadlineTopicProgramAudioFiles: jest.fn(),
    };

    programFileMaker = {
      generateHeadlineTopicProgramFile: jest.fn(),
    };

    programFileUploader = {
      uploadHeadlineTopicProgramFile: jest.fn(),
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
          provide: 'QiitaPostsRepository',
          useValue: qiitaPostsRepository,
        },
        {
          provide: 'HeadlineTopicProgramsRepository',
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
      ],
    }).compile();

    builder = module.get<HeadlineTopicProgramBuilder>(HeadlineTopicProgramBuilder);
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
      const mockPosts = QiitaPostFactory.createQiitaPostModels(3);
      const mockScript = {
        title: 'テスト番組',
        opening: 'オープニング',
        posts: mockPosts.map(post => ({
          id: post.id,
          title: post.title,
          intro: `${post.title}の紹介`,
          explanation: `${post.title}の説明`,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };
      const mockAudioFiles = {
        openingAudioFilePath: '/tmp/opening.mp3',
        postAudioFilePaths: ['/tmp/post1.mp3', '/tmp/post2.mp3', '/tmp/post3.mp3'],
        endingAudioFilePath: '/tmp/ending.mp3',
      };
      const mockGenerateResult = HeadlineTopicProgramFactory.createProgramGenerateResult();
      const mockUploadResult = HeadlineTopicProgramFactory.createProgramUploadResult();
      const mockProgram = HeadlineTopicProgramFactory.createHeadlineTopicProgram();

      qiitaPostsApiClient.findQiitaPostsByTags.mockResolvedValue({
        posts: mockPosts,
        totalCount: mockPosts.length,
        rateLimit: { remaining: 100, reset: new Date() },
      });
      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(mockScript);
      textToSpeechClient.generateHeadlineTopicProgramAudioFiles.mockResolvedValue(mockAudioFiles);
      programFileMaker.generateHeadlineTopicProgramFile.mockResolvedValue(mockGenerateResult);
      programFileUploader.uploadHeadlineTopicProgramFile.mockResolvedValue(mockUploadResult);
      qiitaPostsRepository.upsertQiitaPosts.mockResolvedValue(mockPosts);
      headlineTopicProgramsRepository.createHeadlineTopicProgram.mockResolvedValue(mockProgram);

      const result = await builder.buildProgram(new Date(), mockPosts);

      expect(result).toBeDefined();
      expect(result).toEqual(mockProgram);
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalled();
      expect(openAiApiClient.generateHeadlineTopicProgramScript).toHaveBeenCalled();
      expect(textToSpeechClient.generateHeadlineTopicProgramAudioFiles).toHaveBeenCalled();
      expect(programFileMaker.generateHeadlineTopicProgramFile).toHaveBeenCalled();
      expect(programFileUploader.uploadHeadlineTopicProgramFile).toHaveBeenCalled();
      expect(qiitaPostsRepository.upsertQiitaPosts).toHaveBeenCalled();
      expect(headlineTopicProgramsRepository.createHeadlineTopicProgram).toHaveBeenCalled();
    });

    it('記事取得でエラーが発生した場合、ProgramGenerationErrorがスローされること', async () => {
      const error = new Error('記事取得エラー');
      qiitaPostsApiClient.findQiitaPostsByTags = jest.fn().mockRejectedValue(error);

      await expect(builder.buildProgram(new Date(), [])).rejects.toThrow(HeadlineTopicProgramError);
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalled();
    });
  });

  describe('regenerateProgram', () => {
    it('番組を正常に再生成できること', async () => {
      const programId = 'program-1';
      const mockPosts = QiitaPostFactory.createQiitaPostModels(3);
      const mockScript = {
        title: 'テスト番組',
        opening: 'オープニング',
        posts: mockPosts.map(post => ({
          id: post.id,
          title: post.title,
          intro: `${post.title}の紹介`,
          explanation: `${post.title}の説明`,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };
      const mockAudioFiles = {
        openingAudioFilePath: '/tmp/opening.mp3',
        postAudioFilePaths: ['/tmp/post1.mp3', '/tmp/post2.mp3', '/tmp/post3.mp3'],
        endingAudioFilePath: '/tmp/ending.mp3',
      };
      const mockGenerateResult = HeadlineTopicProgramFactory.createProgramGenerateResult();
      const mockUploadResult = HeadlineTopicProgramFactory.createProgramUploadResult();
      const mockProgram = HeadlineTopicProgramFactory.createHeadlineTopicProgram();

      headlineTopicProgramsRepository.findOne = jest.fn().mockResolvedValue({
        ...mockProgram,
        qiitaPosts: mockPosts,
      });
      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(mockScript);
      textToSpeechClient.generateHeadlineTopicProgramAudioFiles.mockResolvedValue(mockAudioFiles);
      programFileMaker.generateHeadlineTopicProgramFile.mockResolvedValue(mockGenerateResult);
      programFileUploader.uploadHeadlineTopicProgramFile.mockResolvedValue(mockUploadResult);
      headlineTopicProgramsRepository.updateHeadlineTopicProgram.mockResolvedValue(mockProgram);

      const result = await builder.regenerateProgram(programId, 'SCRIPT_AND_AUDIO');

      expect(result).toBeDefined();
      expect(result).toEqual(mockProgram);
      expect(headlineTopicProgramsRepository.findOne).toHaveBeenCalledWith(programId);
      expect(openAiApiClient.generateHeadlineTopicProgramScript).toHaveBeenCalled();
      expect(textToSpeechClient.generateHeadlineTopicProgramAudioFiles).toHaveBeenCalled();
      expect(programFileMaker.generateHeadlineTopicProgramFile).toHaveBeenCalled();
      expect(programFileUploader.uploadHeadlineTopicProgramFile).toHaveBeenCalled();
      expect(headlineTopicProgramsRepository.updateHeadlineTopicProgram).toHaveBeenCalled();
    });

    it('番組が見つからない場合、ProgramRegenerationErrorがスローされること', async () => {
      const programId = 'non-existent-program';
      headlineTopicProgramsRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(builder.regenerateProgram(programId, 'SCRIPT_AND_AUDIO')).rejects.toThrow(HeadlineTopicProgramRegenerateError);
      expect(headlineTopicProgramsRepository.findOne).toHaveBeenCalledWith(programId);
    });
  });

  describe('summarizePosts', () => {
    it('記事を正常に要約できること', async () => {
      const mockPosts = QiitaPostFactory.createQiitaPostModels(3);
      const mockScript = {
        title: 'テスト番組',
        opening: 'オープニング',
        posts: mockPosts.map(post => ({
          id: post.id,
          title: post.title,
          intro: `${post.title}の紹介`,
          explanation: `${post.title}の説明`,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };

      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(mockScript);

      const result = await builder.summarizePosts(mockPosts);

      expect(result).toEqual(mockScript);
      expect(openAiApiClient.generateHeadlineTopicProgramScript).toHaveBeenCalledWith(mockPosts);
    });
  });

  describe('generateScript', () => {
    it('台本を正常に生成できること', async () => {
      const mockPosts = QiitaPostFactory.createQiitaPostModels(3);
      const mockScript = {
        title: 'テスト番組',
        opening: 'オープニング',
        posts: mockPosts.map(post => ({
          id: post.id,
          title: post.title,
          intro: `${post.title}の紹介`,
          explanation: `${post.title}の説明`,
          summary: `${post.title}のまとめ`,
        })),
        ending: 'エンディング',
      };

      qiitaPostsApiClient.findQiitaPostsByTags.mockResolvedValue({
        posts: mockPosts,
        totalCount: mockPosts.length,
        rateLimit: { remaining: 100, reset: new Date() },
      });
      openAiApiClient.generateHeadlineTopicProgramScript.mockResolvedValue(mockScript);

      const result = await builder.generateScript(new Date());

      expect(result).toBeDefined();
      expect(result.script).toEqual(mockScript);
      expect(result.posts).toEqual(mockPosts);
      expect(qiitaPostsApiClient.findQiitaPosts).toHaveBeenCalled();
      expect(openAiApiClient.generateHeadlineTopicProgramScript).toHaveBeenCalled();
    });
  });
});
