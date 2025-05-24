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
                BACKEND_API_ACCESS_TOKEN: 'backend-token',
                QIITA_API_ACCESS_TOKEN: 'qiita-api-access-token',
                DATABASE_URL: 'https://example-database.url',
                SHOW_QUERY_LOGS: 'true',
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
                HEADLINE_TOPIC_PROGRAM_SE_SHORT_FILE_PATH:
                  'headline-topic-program-se-short-file-path',
                HEADLINE_TOPIC_PROGRAM_SE_LONG_FILE_PATH:
                  'headline-topic-program-se-long-file-path',
                HEADLINE_TOPIC_PROGRAM_PICTURE_FILE_PATH:
                  'headline-topic-program-picture-file-path',
                PERSONALIZED_PROGRAM_TARGET_DIR:
                  'personalized-program-target-dir',
                PERSONALIZED_PROGRAM_BGM_FILE_PATH:
                  'personalized-program-bgm-file-path',
                PERSONALIZED_PROGRAM_OPENING_FILE_PATH:
                  'personalized-program-opening-file-path',
                PERSONALIZED_PROGRAM_ENDING_FILE_PATH:
                  'personalized-program-ending-file-path',
                PERSONALIZED_PROGRAM_SE_1_FILE_PATH:
                  'personalized-program-se-1-file-path',
                PERSONALIZED_PROGRAM_SE_2_FILE_PATH:
                  'personalized-program-se-2-file-path',
                PERSONALIZED_PROGRAM_SE_3_FILE_PATH:
                  'personalized-program-se-3-file-path',
                PERSONALIZED_PROGRAM_PICTURE_FILE_PATH:
                  'personalized-program-picture-file-path',
                PROGRAM_AUDIO_BUCKET_NAME: 'program-audio-bucket-name',
                PROGRAM_AUDIO_FILE_URL_PREFIX: 'program-audio-file-url-prefix',
                CLOUDFLARE_ACCESS_KEY_ID: 'cloudflare-access-key-id',
                CLOUDFLARE_SECRET_ACCESS_KEY: 'cloudflare-secret-access-key',
                CLOUDFLARE_R2_ENDPOINT: 'cloudflare-r2-endpoint',
                LP_DEPLOY_HOOK_URL: 'lp-deploy-hook-url',
                LP_BASE_URL: 'lp-base-url',
                GCP_CREDENTIALS_FILE_PATH: 'gcp-credentials-file-path',
                POST_TO_X: 'true',
                X_API_KEY: 'x-api-key',
                X_API_SECRET: 'x-api-secret',
                X_API_ACCESS_TOKEN: 'x-api-access-token',
                X_API_ACCESS_SECRET: 'x-api-access-secret',
                SLACK_INCOMING_WEBHOOK_URL: 'slack-incoming-webhook-url',
                FREE_PLAN_ID: 'free-plan',
                PRO_PLAN_ID: 'pro-plan',
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

  it('BACKEND_API_ACCESS_TOKEN が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'BACKEND_API_ACCESS_TOKEN') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
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

  it('HEADLINE_TOPIC_PROGRAM_SE_SHORT_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_SE_SHORT_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('HEADLINE_TOPIC_PROGRAM_SE_LONG_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'HEADLINE_TOPIC_PROGRAM_SE_LONG_FILE_PATH') return null;
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

  it('PERSONALIZED_PROGRAM_TARGET_DIR が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_TARGET_DIR') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_BGM_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_BGM_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_OPENING_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_OPENING_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_ENDING_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_ENDING_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_SE_1_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_SE_1_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_SE_2_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_SE_2_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_SE_3_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_SE_3_FILE_PATH') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PERSONALIZED_PROGRAM_PICTURE_FILE_PATH が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PERSONALIZED_PROGRAM_PICTURE_FILE_PATH') return null;
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

  it('CLOUDFLARE_ACCESS_KEY_ID が設定されている場合は、CLOUDFLARE_SECRET_ACCESS_KEY と CLOUDFLARE_R2_ENDPOINT が設定されているべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'CLOUDFLARE_ACCESS_KEY_ID') return 'some-value';
      if (key === 'CLOUDFLARE_SECRET_ACCESS_KEY') return null;
      if (key === 'CLOUDFLARE_R2_ENDPOINT') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('LP_DEPLOY_HOOK_URL が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'LP_DEPLOY_HOOK_URL') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('LP_BASE_URL が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'LP_BASE_URL') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('POST_TO_X が設定されていない場合、false を返すべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'POST_TO_X') return null;
      return 'some-value';
    });

    const appConfigService = new AppConfigService(configService);
    expect(appConfigService.PostToX).toBe(false);
  });

  it('POST_TO_X に true 以外が設定されている場合は、false を返すべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'POST_TO_X') return 'false';
      return 'some-value';
    });

    const appConfigService = new AppConfigService(configService);
    expect(appConfigService.PostToX).toBe(false);
  });

  it('POST_TO_X が true の場合、PostToX が true を返すべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'POST_TO_X') return 'true';
      return 'some-value';
    });

    const appConfigService = new AppConfigService(configService);
    expect(appConfigService.PostToX).toBeTruthy();
  });

  it('X_API_KEY が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'X_API_KEY') return null;
      if (key === 'POST_TO_X') return 'true'; // POST_TO_X が true の場合、X_API_KEY が必要
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('X_API_SECRET が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'X_API_SECRET') return null;
      if (key === 'POST_TO_X') return 'true'; // POST_TO_X が true の場合、X_API_SECRET が必要
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('X_API_ACCESS_TOKEN が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'X_API_ACCESS_TOKEN') return null;
      if (key === 'POST_TO_X') return 'true'; // POST_TO_X が true の場合、X_API_ACCESS_TOKEN が必要
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('X_API_ACCESS_SECRET が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'X_API_ACCESS_SECRET') return null;
      if (key === 'POST_TO_X') return 'true'; // POST_TO_X が true の場合、X_API_ACCESS_SECRET が必要
      return;
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('SLACK_INCOMING_WEBHOOK_URL が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'SLACK_INCOMING_WEBHOOK_URL') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('FREE_PLAN_ID が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'FREE_PLAN_ID') return null;
      return 'some-value';
    });

    expect(() => new AppConfigService(configService)).toThrow(
      AppConfigValidationError,
    );
  });

  it('PRO_PLAN_ID が設定されていない場合、エラーをスローするべき', () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'PRO_PLAN_ID') return null;
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
    expect(service.HeadlineTopicProgramSeShortFilePath).toBe(
      'headline-topic-program-se-short-file-path',
    );
    expect(service.HeadlineTopicProgramSeLongFilePath).toBe(
      'headline-topic-program-se-long-file-path',
    );
    expect(service.HeadlineTopicProgramPictureFilePath).toBe(
      'headline-topic-program-picture-file-path',
    );
    expect(service.PersonalizedProgramTargetDir).toBe(
      'personalized-program-target-dir',
    );
    expect(service.PersonalizedProgramBgmFilePath).toBe(
      'personalized-program-bgm-file-path',
    );
    expect(service.PersonalizedProgramOpeningFilePath).toBe(
      'personalized-program-opening-file-path',
    );
    expect(service.PersonalizedProgramEndingFilePath).toBe(
      'personalized-program-ending-file-path',
    );
    expect(service.PersonalizedProgramSe1FilePath).toBe(
      'personalized-program-se-1-file-path',
    );
    expect(service.PersonalizedProgramSe2FilePath).toBe(
      'personalized-program-se-2-file-path',
    );
    expect(service.PersonalizedProgramSe3FilePath).toBe(
      'personalized-program-se-3-file-path',
    );
    expect(service.PersonalizedProgramPictureFilePath).toBe(
      'personalized-program-picture-file-path',
    );
    expect(service.ProgramAudioBucketName).toBe('program-audio-bucket-name');
    expect(service.ProgramAudioFileUrlPrefix).toBe(
      'program-audio-file-url-prefix',
    );
    expect(service.CloudflareAccessKeyId).toBe('cloudflare-access-key-id');
    expect(service.CloudflareSecretAccessKey).toBe(
      'cloudflare-secret-access-key',
    );
    expect(service.CloudflareR2Endpoint).toBe('cloudflare-r2-endpoint');
    expect(service.LpDeployHookUrl).toBe('lp-deploy-hook-url');
    expect(service.LpBaseUrl).toBe('lp-base-url');
    expect(service.GoogleCloudCredentialsFilePath).toBe(
      'gcp-credentials-file-path',
    );
    expect(service.PostToX).toBeTruthy();
    expect(service.XApiKey).toBe('x-api-key');
    expect(service.XApiSecret).toBe('x-api-secret');
    expect(service.XApiAccessToken).toBe('x-api-access-token');
    expect(service.XApiAccessSecret).toBe('x-api-access-secret');
    expect(service.FreePlanId).toBe('free-plan');
    expect(service.ProPlanId).toBe('pro-plan');
  });
});
