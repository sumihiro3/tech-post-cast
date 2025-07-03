import { AppConfigService } from '@/app-config/app-config.service';
import {
  RssFileDeleteCommand,
  RssFileUploadCommand,
} from '@/domains/rss/rss-file-uploader.interface';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { S3RssFileUploader } from './rss-file-uploader';

// AWS SDK のモック
jest.mock('@aws-sdk/client-s3');
const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockSend = jest.fn();

describe('S3RssFileUploader', () => {
  let uploader: S3RssFileUploader;
  let appConfigService: jest.Mocked<AppConfigService>;

  beforeEach(async () => {
    const mockAppConfigService = {
      CloudflareAccessKeyId: 'test-access-key',
      CloudflareSecretAccessKey: 'test-secret-key',
      CloudflareR2Endpoint: 'https://test-endpoint.r2.cloudflarestorage.com',
      RssUrlPrefix: 'https://rss.techpostcast.com',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3RssFileUploader,
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    uploader = module.get<S3RssFileUploader>(S3RssFileUploader);
    appConfigService = module.get(AppConfigService);

    // S3Clientのモック設定
    mockS3Client.prototype.send = mockSend;
    jest.clearAllMocks();
  });

  describe('upload', () => {
    const mockCommand: RssFileUploadCommand = {
      userId: 'user-123',
      rssToken: 'test-rss-token-123',
      bucketName: 'test-rss-bucket',
      uploadPath: 'u/test-rss-token-123/rss.xml',
      filePath: '/tmp/rss_test-rss-token-123_1234567890.xml',
      contentType: 'application/rss+xml',
    };

    it('正常にRSSファイルをアップロードできる', async () => {
      // fs/promisesのreadFileをモック
      const fs = require('fs/promises');
      jest
        .spyOn(fs, 'readFile')
        .mockResolvedValue(Buffer.from('<rss>test</rss>'));

      mockSend.mockResolvedValue({});

      const result = await uploader.upload(mockCommand);

      expect(result.rssUrl).toBe(
        'https://rss.techpostcast.com/u/test-rss-token-123/rss.xml',
      );
      expect(result.uploadPath).toBe('u/test-rss-token-123/rss.xml');
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('アップロードでエラーが発生した場合は例外を投げる', async () => {
      const fs = require('fs/promises');
      jest
        .spyOn(fs, 'readFile')
        .mockResolvedValue(Buffer.from('<rss>test</rss>'));

      mockSend.mockRejectedValue(new Error('Upload failed'));

      await expect(uploader.upload(mockCommand)).rejects.toThrow(
        'Cloudflare R2 へのRSSファイルアップロードに失敗しました',
      );
    });
  });

  describe('delete', () => {
    const mockCommand: RssFileDeleteCommand = {
      bucketName: 'test-rss-bucket',
      filePath: 'u/test-rss-token-123/rss.xml',
    };

    it('正常にRSSファイルを削除できる', async () => {
      mockSend.mockResolvedValue({});

      await uploader.delete(mockCommand);

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('削除でエラーが発生した場合は例外を投げる', async () => {
      mockSend.mockRejectedValue(new Error('Delete failed'));

      await expect(uploader.delete(mockCommand)).rejects.toThrow(
        'Cloudflare R2 からRSSファイル削除に失敗しました',
      );
    });
  });

  describe('constructor', () => {
    it('CloudFlare設定がある場合はCloudFlare R2を使用する', () => {
      expect(appConfigService.CloudflareAccessKeyId).toBe('test-access-key');
      expect(appConfigService.CloudflareSecretAccessKey).toBe(
        'test-secret-key',
      );
      expect(appConfigService.CloudflareR2Endpoint).toBe(
        'https://test-endpoint.r2.cloudflarestorage.com',
      );
    });
  });
});
