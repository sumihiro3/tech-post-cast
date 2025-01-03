import { AppConfigValidationError } from '@/types/errors';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { AppConfigService } from './app-config.service';

const moduleMocker = new ModuleMocker(global);

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // ここで定義したキーが、ConfigService の get メソッドに渡される
              const configKeys = {
                V1_API_ACCESS_TOKEN: 'v1-token',
                QIITA_API_ACCESS_TOKEN: 'qiita-api-access-token',
                DATABASE_URL: 'https://example-database.url',
                SHOW_QUERY_LOGS: true,
                OPENAI_API_KEY: 'openai-api-key',
                OPEN_AI_SUMMARIZATION_MODEL: 'gpt-4o-mini',
                OPEN_AI_SCRIPT_GENERATION_MODEL: 'gpt-4o-mini',
                PROGRAM_FILE_GENERATION_TEMP_DIR:
                  'program-file-generation-temp-dir',
                HEADLINE_TOPIC_PROGRAM_TARGET_DIR:
                  'headline-topic-program-target-dir',
                HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH:
                  'headline-topic-program-bgm-file-path',
                HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH:
                  'headline-topic-program-opening-file-path',
                HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH:
                  'headline-topic-program-ending-file-path',
                HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH:
                  'headline-topic-program-picture-file-path',
                PROGRAM_AUDIO_BUCKET_NAME: 'program-audio-bucket-name',
                PROGRAM_AUDIO_FILE_URL_PREFIX: 'program-audio-file-url-prefix',
              };
              return configKeys[key];
            }),
          },
        },
      ],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('サービスが定義されているべき', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('V1_API_ACCESS_TOKEN が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'V1_API_ACCESS_TOKEN') return null;
      return 'some-value';
    });
  });

  it('DATABASE_URL が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'DATABASE_URL') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('QIITA_API_ACCESS_TOKEN が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'QIITA_API_ACCESS_TOKEN') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('OPENAI_API_KEY が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'OPENAI_API_KEY') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PROGRAM_FILE_GENERATION_TEMP_DIR が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PROGRAM_FILE_GENERATION_TEMP_DIR') return null;
      return 'some-value';
    });
    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('HEADLINE_TOPIC_PROGRAM_TARGET_DIR が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_TARGET_DIR') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_BGM_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_OPENING_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_ENDING_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PROGRAM_AUDIO_BUCKET_NAME が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PROGRAM_AUDIO_BUCKET_NAME') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PROGRAM_AUDIO_FILE_URL_PREFIX が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PROGRAM_AUDIO_FILE_URL_PREFIX') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('ゲッターから正しい値を返すべき', () => {
    expect(service.DatabaseUrl).toBe('https://example-database.url');
    expect(service.ShowQueryLogs).toBe(true);
    expect(service.QiitaAccessToken).toBe('qiita-api-access-token');
    expect(service.OpenAiApiKey).toBe('openai-api-key');
    expect(service.OpenAiSummarizationModel).toBe('gpt-4o-mini');
    expect(service.OpenAiScriptGenerationModel).toBe('gpt-4o-mini');
    expect(service.HeadlineTopicProgramTargetDir).toBe(
      'headline-topic-program-target-dir',
    );
    expect(service.HeadlineTopicProgramBgmFilePath).toBe(
      'headline-topic-program-bgm-file-path',
    );
    expect(service.HeadlineTopicProgramOpeningFilePath).toBe(
      'headline-topic-program-opening-file-path',
    );
    expect(service.HeadlineTopicProgramEndingFilePath).toBe(
      'headline-topic-program-ending-file-path',
    );
    expect(service.HeadlineTopicProgramPictureFilePath).toBe(
      'headline-topic-program-picture-file-path',
    );
    expect(service.ProgramAudioBucketName).toBe('program-audio-bucket-name');
    expect(service.ProgramAudioFileUrlPrefix).toBe(
      'program-audio-file-url-prefix',
    );
  });
});
