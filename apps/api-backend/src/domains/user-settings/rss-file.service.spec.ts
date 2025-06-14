import { AppConfigService } from '@/app-config/app-config.service';
import { IPersonalizedProgramsRepository } from '@/domains/personalized-programs/personalized-programs.repository.interface';
import { AppUserFactory } from '@/test/factories';
import { PersonalizedProgramFactory } from '@/test/factories/personalized-program.factory';
import {
  setupLogSuppression,
  teardownLogSuppression,
} from '@/test/helpers/logger.helper';
import { RssFileGenerationError, RssFileUploadError } from '@/types/errors';
import { Test, TestingModule } from '@nestjs/testing';
import { PersonalRssGenerator } from '@tech-post-cast/commons';
import { existsSync } from 'fs';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  IRssFileUploader,
  RssFileUploadCommand,
  RssFileUploadResult,
} from './rss-file-uploader.interface';
import { RssFileService } from './rss-file.service';

// PersonalRssGeneratorをモック
jest.mock('@tech-post-cast/commons', () => ({
  ...jest.requireActual('@tech-post-cast/commons'),
  PersonalRssGenerator: {
    generateUserRss: jest.fn(),
    validateRssGeneration: jest.fn(),
  },
}));

describe('RssFileService', () => {
  let service: RssFileService;
  let appConfigService: jest.Mocked<AppConfigService>;
  let personalizedProgramsRepository: jest.Mocked<IPersonalizedProgramsRepository>;
  let rssFileUploader: jest.Mocked<IRssFileUploader>;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = setupLogSuppression();

    const mockAppConfigService = {
      LpBaseUrl: 'https://techpostcast.com',
      RssUrlPrefix: 'https://rss.techpostcast.com',
      RssBucketName: 'test-bucket',
      PodcastImageUrl: 'https://techpostcast.com/images/default.jpg',
      PodcastAuthorName: 'Tech Post Cast',
      PodcastAuthorEmail: 'info@techpostcast.com',
    };

    const mockPersonalizedProgramsRepository = {
      findByUserIdWithPagination: jest.fn(),
      findAllByUserIdForStats: jest.fn(),
      findById: jest.fn(),
    };

    const mockRssFileUploader = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RssFileService,
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
        {
          provide: 'PersonalizedProgramsRepository',
          useValue: mockPersonalizedProgramsRepository,
        },
        {
          provide: 'RssFileUploader',
          useValue: mockRssFileUploader,
        },
      ],
    }).compile();

    service = module.get<RssFileService>(RssFileService);
    appConfigService = module.get(AppConfigService);
    personalizedProgramsRepository = module.get(
      'PersonalizedProgramsRepository',
    );
    rssFileUploader = module.get('RssFileUploader');
  });

  afterEach(() => {
    teardownLogSuppression(logSpies);
    jest.clearAllMocks();
  });

  describe('generateUserRssFile', () => {
    it('RSS機能が有効なユーザーのRSSファイルを正常に生成できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const programs = PersonalizedProgramFactory.createPersonalizedPrograms(2);
      const mockXml = '<?xml version="1.0" encoding="UTF-8"?><rss>test</rss>';
      const mockRssResult = {
        xml: mockXml,
        episodeCount: 2,
        generatedAt: new Date(),
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        {
          programs,
          totalCount: 2,
        },
      );
      (PersonalRssGenerator.generateUserRss as jest.Mock).mockReturnValue(
        mockRssResult,
      );

      // Act
      const result = await service.generateUserRssFile(appUser);

      // Assert
      expect(result.xml).toBe(mockXml);
      expect(result.episodeCount).toBe(2);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.tempFilePath).toContain(tmpdir());
      expect(existsSync(result.tempFilePath)).toBe(true);

      // 一時ファイルの内容を確認
      const fileContent = await readFile(result.tempFilePath, 'utf-8');
      expect(fileContent).toBe(mockXml);

      // 一時ファイルをクリーンアップ
      await unlink(result.tempFilePath);

      // PersonalRssGeneratorが正しい引数で呼ばれたことを確認
      expect(PersonalRssGenerator.generateUserRss).toHaveBeenCalledWith(
        expect.objectContaining({
          id: appUser.id,
          displayName: appUser.displayName,
          rssToken: appUser.rssToken,
        }),
        expect.arrayContaining([
          expect.objectContaining({
            id: programs[0].id,
            title: programs[0].title,
            audioUrl: programs[0].audioUrl,
            audioDuration: programs[0].audioDuration,
          }),
        ]),
        expect.objectContaining({
          maxEpisodes: 30,
          baseUrl: 'https://techpostcast.com',
          rssUrlPrefix: 'https://rss.techpostcast.com',
          defaultImageUrl: 'https://techpostcast.com/images/default.jpg',
          authorEmail: 'info@techpostcast.com',
        }),
      );
    });

    it('番組が存在しない場合でもRSSファイルを生成できること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const mockXml = '<?xml version="1.0" encoding="UTF-8"?><rss>empty</rss>';
      const mockRssResult = {
        xml: mockXml,
        episodeCount: 0,
        generatedAt: new Date(),
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        {
          programs: [],
          totalCount: 0,
        },
      );
      (PersonalRssGenerator.generateUserRss as jest.Mock).mockReturnValue(
        mockRssResult,
      );

      // Act
      const result = await service.generateUserRssFile(appUser);

      // Assert
      expect(result.xml).toBe(mockXml);
      expect(result.episodeCount).toBe(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.tempFilePath).toContain(tmpdir());

      // 一時ファイルをクリーンアップ
      await unlink(result.tempFilePath);
    });

    it('RSS機能が無効なユーザーの場合、RssFileGenerationErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssDisabled();

      // Act & Assert
      await expect(service.generateUserRssFile(appUser)).rejects.toThrow(
        RssFileGenerationError,
      );
      await expect(service.generateUserRssFile(appUser)).rejects.toThrow(
        'RSSファイル生成に失敗しました',
      );
      expect(
        personalizedProgramsRepository.findByUserIdWithPagination,
      ).not.toHaveBeenCalled();
    });

    it('RSSトークンが未設定なユーザーの場合、RssFileGenerationErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser({
        rssEnabled: true,
        rssToken: null,
      });

      // Act & Assert
      await expect(service.generateUserRssFile(appUser)).rejects.toThrow(
        RssFileGenerationError,
      );
      expect(
        personalizedProgramsRepository.findByUserIdWithPagination,
      ).not.toHaveBeenCalled();
    });

    it('番組取得でエラーが発生した場合、RssFileGenerationErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const error = new Error('Database error');

      personalizedProgramsRepository.findByUserIdWithPagination.mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(service.generateUserRssFile(appUser)).rejects.toThrow(
        RssFileGenerationError,
      );
      await expect(service.generateUserRssFile(appUser)).rejects.toThrow(
        'RSSファイル生成に失敗しました',
      );
    });

    it('RSS生成でエラーが発生した場合、RssFileGenerationErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const programs = PersonalizedProgramFactory.createPersonalizedPrograms(2);

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        {
          programs,
          totalCount: 2,
        },
      );
      (PersonalRssGenerator.generateUserRss as jest.Mock).mockImplementation(
        () => {
          throw new Error('RSS generation error');
        },
      );

      // Act & Assert
      await expect(service.generateUserRssFile(appUser)).rejects.toThrow(
        RssFileGenerationError,
      );
    });
  });

  describe('uploadRssFile', () => {
    const mockGenerationResult = {
      xml: '<?xml version="1.0" encoding="UTF-8"?><rss>test</rss>',
      episodeCount: 2,
      generatedAt: new Date(),
      tempFilePath: join(tmpdir(), 'test-rss-file.xml'),
    };

    beforeEach(async () => {
      // テスト用の一時ファイルを作成
      const { writeFile } = await import('fs/promises');
      await writeFile(
        mockGenerationResult.tempFilePath,
        mockGenerationResult.xml,
      );
    });

    afterEach(async () => {
      // テスト後に一時ファイルを削除（存在する場合のみ）
      try {
        await unlink(mockGenerationResult.tempFilePath);
      } catch {
        // ファイルが存在しない場合は無視
      }
    });

    it('正常にRSSファイルをアップロードできること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const mockUploadResult: RssFileUploadResult = {
        rssUrl: 'https://rss.techpostcast.com/u/test-rss-token/rss.xml',
        uploadPath: 'u/test-rss-token/rss.xml',
      };
      rssFileUploader.upload.mockResolvedValue(mockUploadResult);

      // Act
      const result = await service.uploadRssFile(mockGenerationResult, appUser);

      // Assert
      expect(result.rssUrl).toBe(mockUploadResult.rssUrl);
      expect(result.episodeCount).toBe(2);
      expect(result.generatedAt).toBe(mockGenerationResult.generatedAt);

      // S3RssFileUploaderが正しい引数で呼ばれたことを確認
      expect(rssFileUploader.upload).toHaveBeenCalledWith({
        userId: appUser.id,
        rssToken: appUser.rssToken,
        bucketName: 'test-bucket',
        uploadPath: `u/${appUser.rssToken}/rss.xml`,
        filePath: mockGenerationResult.tempFilePath,
      } as RssFileUploadCommand);

      // 一時ファイルが削除されたことを確認
      expect(existsSync(mockGenerationResult.tempFilePath)).toBe(false);
    });

    it('RSSトークンが未設定の場合、RssFileUploadErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createAppUser({
        rssEnabled: true,
        rssToken: null,
      });

      // Act & Assert
      await expect(
        service.uploadRssFile(mockGenerationResult, appUser),
      ).rejects.toThrow(RssFileUploadError);
      await expect(
        service.uploadRssFile(mockGenerationResult, appUser),
      ).rejects.toThrow('RSSファイルアップロードに失敗しました');

      // 一時ファイルが削除されたことを確認
      expect(existsSync(mockGenerationResult.tempFilePath)).toBe(false);
    });

    it('アップロードでエラーが発生した場合、RssFileUploadErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const error = new Error('Upload error');
      rssFileUploader.upload.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.uploadRssFile(mockGenerationResult, appUser),
      ).rejects.toThrow(RssFileUploadError);
      await expect(
        service.uploadRssFile(mockGenerationResult, appUser),
      ).rejects.toThrow('RSSファイルアップロードに失敗しました');

      // 一時ファイルが削除されたことを確認
      expect(existsSync(mockGenerationResult.tempFilePath)).toBe(false);
    });
  });

  describe('generateAndUploadUserRss', () => {
    it('正常にRSSファイルを生成してアップロードできること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const programs = PersonalizedProgramFactory.createPersonalizedPrograms(2);
      const mockXml = '<?xml version="1.0" encoding="UTF-8"?><rss>test</rss>';
      const mockRssResult = {
        xml: mockXml,
        episodeCount: 2,
        generatedAt: new Date(),
      };
      const mockUploadResult: RssFileUploadResult = {
        rssUrl: 'https://rss.techpostcast.com/u/test-rss-token/rss.xml',
        uploadPath: 'u/test-rss-token/rss.xml',
      };

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        {
          programs,
          totalCount: 2,
        },
      );
      (PersonalRssGenerator.generateUserRss as jest.Mock).mockReturnValue(
        mockRssResult,
      );
      rssFileUploader.upload.mockResolvedValue(mockUploadResult);

      // Act
      const result = await service.generateAndUploadUserRss(appUser);

      // Assert
      expect(result.rssUrl).toBe(mockUploadResult.rssUrl);
      expect(result.episodeCount).toBe(2);
      expect(result.generatedAt).toBeInstanceOf(Date);

      // 各メソッドが呼ばれたことを確認
      expect(
        personalizedProgramsRepository.findByUserIdWithPagination,
      ).toHaveBeenCalledWith(appUser.id, {
        limit: 30,
        offset: 0,
        orderBy: { createdAt: 'desc' },
      });
      expect(PersonalRssGenerator.generateUserRss).toHaveBeenCalled();
      expect(rssFileUploader.upload).toHaveBeenCalled();
    });

    it('生成でエラーが発生した場合、RssFileGenerationErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssDisabled();

      // Act & Assert
      await expect(service.generateAndUploadUserRss(appUser)).rejects.toThrow(
        RssFileGenerationError,
      );
    });

    it('アップロードでエラーが発生した場合、RssFileUploadErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const programs = PersonalizedProgramFactory.createPersonalizedPrograms(2);
      const mockXml = '<?xml version="1.0" encoding="UTF-8"?><rss>test</rss>';
      const mockRssResult = {
        xml: mockXml,
        episodeCount: 2,
        generatedAt: new Date(),
      };
      const uploadError = new Error('Upload error');

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        {
          programs,
          totalCount: 2,
        },
      );
      (PersonalRssGenerator.generateUserRss as jest.Mock).mockReturnValue(
        mockRssResult,
      );
      rssFileUploader.upload.mockRejectedValue(uploadError);

      // Act & Assert
      await expect(service.generateAndUploadUserRss(appUser)).rejects.toThrow(
        RssFileUploadError,
      );
    });

    it('RSSファイルアップロードでエラーが発生した場合、RssFileUploadErrorをスローすること', async () => {
      // Arrange
      const appUser = AppUserFactory.createUserWithRssEnabled();
      const programs = PersonalizedProgramFactory.createPersonalizedPrograms(2);

      personalizedProgramsRepository.findByUserIdWithPagination.mockResolvedValue(
        {
          programs,
          totalCount: 2,
        },
      );

      rssFileUploader.upload.mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(service.generateAndUploadUserRss(appUser)).rejects.toThrow(
        RssFileUploadError,
      );
    });
  });

  describe('deleteUserRssFile', () => {
    it('正常にRSSファイルを削除できること', async () => {
      // Arrange
      const rssToken = 'test-rss-token-123';
      const userId = 'user-123';

      rssFileUploader.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteUserRssFile(rssToken, userId);

      // Assert
      expect(rssFileUploader.delete).toHaveBeenCalledWith({
        bucketName: 'test-bucket',
        filePath: `u/${rssToken}/rss.xml`,
      });
    });

    it('ユーザーIDが指定されていない場合でも削除できること', async () => {
      // Arrange
      const rssToken = 'test-rss-token-123';

      rssFileUploader.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteUserRssFile(rssToken);

      // Assert
      expect(rssFileUploader.delete).toHaveBeenCalledWith({
        bucketName: 'test-bucket',
        filePath: `u/${rssToken}/rss.xml`,
      });
    });

    it('削除でエラーが発生した場合、RssFileUploadErrorをスローすること', async () => {
      // Arrange
      const rssToken = 'test-rss-token-123';
      const userId = 'user-123';

      rssFileUploader.delete.mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(service.deleteUserRssFile(rssToken, userId)).rejects.toThrow(
        RssFileUploadError,
      );
      expect(rssFileUploader.delete).toHaveBeenCalledWith({
        bucketName: 'test-bucket',
        filePath: `u/${rssToken}/rss.xml`,
      });
    });
  });
});
