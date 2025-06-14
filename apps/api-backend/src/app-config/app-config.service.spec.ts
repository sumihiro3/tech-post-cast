import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from './app-config.service';

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
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('QiitaAccessToken', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'test-qiita-token';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.QiitaAccessToken;

      expect(configService.get).toHaveBeenCalledWith(
        'QIITA_API_ACCESS_TOKEN',
        '',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、空文字をデフォルト値として返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');

      const result = service.QiitaAccessToken;

      expect(result).toBe('');
    });
  });

  describe('FreePlanId', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'free-plan-123';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.FreePlanId;

      expect(configService.get).toHaveBeenCalledWith('FREE_PLAN_ID', '');
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、空文字をデフォルト値として返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');

      const result = service.FreePlanId;

      expect(result).toBe('');
    });
  });

  describe('ProPlanId', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'pro-plan-456';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.ProPlanId;

      expect(configService.get).toHaveBeenCalledWith('PRO_PLAN_ID', '');
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、空文字をデフォルト値として返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');

      const result = service.ProPlanId;

      expect(result).toBe('');
    });
  });

  describe('RssUrlPrefix', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'https://custom-rss.example.com';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.RssUrlPrefix;

      expect(configService.get).toHaveBeenCalledWith(
        'RSS_URL_PREFIX',
        'https://rss.techpostcast.com',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、デフォルト値を返すこと', () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue('https://rss.techpostcast.com');

      const result = service.RssUrlPrefix;

      expect(result).toBe('https://rss.techpostcast.com');
    });
  });

  describe('RssBucketName', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'custom-rss-bucket';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.RssBucketName;

      expect(configService.get).toHaveBeenCalledWith(
        'RSS_BUCKET_NAME',
        'tech-post-cast-rss',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、デフォルト値を返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('tech-post-cast-rss');

      const result = service.RssBucketName;

      expect(result).toBe('tech-post-cast-rss');
    });
  });

  describe('LpBaseUrl', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'https://custom.example.com';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.LpBaseUrl;

      expect(configService.get).toHaveBeenCalledWith(
        'LP_BASE_URL',
        'https://techpostcast.com',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、デフォルト値を返すこと', () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue('https://techpostcast.com');

      const result = service.LpBaseUrl;

      expect(result).toBe('https://techpostcast.com');
    });
  });

  describe('PodcastImageUrl', () => {
    it('環境変数が設定されている場合、その値を返すこと', () => {
      // Arrange
      const expectedUrl = 'https://example.com/custom-image.jpg';
      jest.spyOn(configService, 'get').mockReturnValue(expectedUrl);

      // Act
      const result = service.PodcastImageUrl;

      // Assert
      expect(result).toBe(expectedUrl);
      expect(configService.get).toHaveBeenCalledWith(
        'PODCAST_IMAGE_URL',
        'https://program-files.techpostcast.com/TechPostCast_Podcast.png',
      );
    });

    it('環境変数が設定されていない場合、デフォルト値を返すこと', () => {
      // Arrange
      jest
        .spyOn(configService, 'get')
        .mockReturnValue(
          'https://program-files.techpostcast.com/TechPostCast_Podcast.png',
        );

      // Act
      const result = service.PodcastImageUrl;

      // Assert
      expect(result).toBe(
        'https://program-files.techpostcast.com/TechPostCast_Podcast.png',
      );
    });
  });

  describe('PodcastAuthorName', () => {
    it('環境変数が設定されている場合、その値を返すこと', () => {
      // Arrange
      const expectedName = 'Custom Podcast Author';
      jest.spyOn(configService, 'get').mockReturnValue(expectedName);

      // Act
      const result = service.PodcastAuthorName;

      // Assert
      expect(result).toBe(expectedName);
      expect(configService.get).toHaveBeenCalledWith(
        'PODCAST_AUTHOR_NAME',
        'TEP Lab',
      );
    });

    it('環境変数が設定されていない場合、デフォルト値を返すこと', () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue('TEP Lab');

      // Act
      const result = service.PodcastAuthorName;

      // Assert
      expect(result).toBe('TEP Lab');
    });
  });

  describe('PodcastAuthorEmail', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'custom@example.com';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.PodcastAuthorEmail;

      expect(configService.get).toHaveBeenCalledWith(
        'PODCAST_AUTHOR_EMAIL',
        'tpc@tep-lab.com',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、デフォルト値を返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('info@techpostcast.com');

      const result = service.PodcastAuthorEmail;

      expect(result).toBe('info@techpostcast.com');
    });
  });

  describe('CloudflareR2Endpoint', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'https://abc123.r2.cloudflarestorage.com';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.CloudflareR2Endpoint;

      expect(configService.get).toHaveBeenCalledWith(
        'CLOUDFLARE_R2_ENDPOINT',
        '',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、空文字をデフォルト値として返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');

      const result = service.CloudflareR2Endpoint;

      expect(result).toBe('');
    });
  });

  describe('CloudflareAccessKeyId', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'test-access-key-id';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.CloudflareAccessKeyId;

      expect(configService.get).toHaveBeenCalledWith(
        'CLOUDFLARE_ACCESS_KEY_ID',
        '',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、空文字をデフォルト値として返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');

      const result = service.CloudflareAccessKeyId;

      expect(result).toBe('');
    });
  });

  describe('CloudflareSecretAccessKey', () => {
    it('環境変数から値を取得できること', () => {
      const mockValue = 'test-secret-access-key';
      jest.spyOn(configService, 'get').mockReturnValue(mockValue);

      const result = service.CloudflareSecretAccessKey;

      expect(configService.get).toHaveBeenCalledWith(
        'CLOUDFLARE_SECRET_ACCESS_KEY',
        '',
      );
      expect(result).toBe(mockValue);
    });

    it('環境変数が未設定の場合、空文字をデフォルト値として返すこと', () => {
      jest.spyOn(configService, 'get').mockReturnValue('');

      const result = service.CloudflareSecretAccessKey;

      expect(result).toBe('');
    });
  });
});
