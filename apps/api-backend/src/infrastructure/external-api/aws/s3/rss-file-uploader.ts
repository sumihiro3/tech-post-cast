import { AppConfigService } from '@/app-config/app-config.service';
import {
  IRssFileUploader,
  RssFileDeleteCommand,
  RssFileUploadCommand,
  RssFileUploadResult,
} from '@/domains/user-settings/rss-file-uploader.interface';
import { RssFileUploadError } from '@/types/errors';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

/**
 * RSSファイルをCloudFlare R2にアップロードする機能を提供する
 */
@Injectable()
export class S3RssFileUploader implements IRssFileUploader {
  private readonly logger = new Logger(S3RssFileUploader.name);

  private s3Client: S3Client;

  constructor(private readonly appConfig: AppConfigService) {
    if (!this.appConfig.CloudflareAccessKeyId) {
      // Cloudflare Access Key ID が設定されていない場合は、AWS S3 を利用する
      this.logger.log('AWS S3 を利用してRSSファイルアップロードを行います');
      this.s3Client = this.createS3Client();
    } else {
      this.logger.log(
        'Cloudflare R2 を利用してRSSファイルアップロードを行います',
      );
      // Cloudflare Access Key ID が設定されている場合は、Cloudflare R2 を利用する
      this.s3Client = this.createCloudflareR2S3Client();
    }
  }

  /**
   * S3クライアントを生成する
   * @returns S3クライアント
   */
  createS3Client(): S3Client {
    return new S3Client({});
  }

  /**
   * Cloudflare R2 向けの S3 クライアントを生成する
   * @returns Cloudflare R2 向けの S3 クライアント
   */
  createCloudflareR2S3Client(): S3Client {
    return new S3Client({
      region: 'auto',
      endpoint: this.appConfig.CloudflareR2Endpoint,
      credentials: {
        accessKeyId: this.appConfig.CloudflareAccessKeyId,
        secretAccessKey: this.appConfig.CloudflareSecretAccessKey,
      },
    });
  }

  /**
   * RSSファイルをアップロードする
   * @param command アップロード要求コマンド
   * @returns アップロード結果
   */
  async upload(command: RssFileUploadCommand): Promise<RssFileUploadResult> {
    this.logger.debug(`S3RssFileUploader.upload called`, {
      userId: command.userId,
      rssToken: command.rssToken ? '***' : null,
      bucketName: command.bucketName,
      uploadPath: command.uploadPath,
      filePath: command.filePath,
      contentType: command.contentType,
    });

    try {
      this.logger.debug(`RSSファイルアップロードを開始します`, {
        userId: command.userId,
        uploadPath: command.uploadPath,
      });

      const s3UploadCommand = new PutObjectCommand({
        Bucket: command.bucketName,
        Key: command.uploadPath,
        Body: await readFile(command.filePath),
        ContentType: command.contentType || 'application/rss+xml',
        CacheControl: 'max-age=300', // 5分間キャッシュ
        Metadata: {
          userId: command.userId,
          rssToken: command.rssToken,
          uploadedAt: new Date().toISOString(),
        },
      });

      const uploadResult = await this.s3Client.send(s3UploadCommand);

      // アップロードしたファイルのURL
      const rssUrl = `${this.appConfig.RssUrlPrefix}/${command.uploadPath}`;

      this.logger.log(`Cloudflare R2 にRSSファイルアップロードが完了しました`, {
        userId: command.userId,
        uploadPath: command.uploadPath,
        rssUrl,
        etag: uploadResult.ETag,
      });

      return {
        rssUrl,
        uploadPath: command.uploadPath,
      };
    } catch (error) {
      const errorMessage = `Cloudflare R2 へのRSSファイルアップロードに失敗しました： ${command.filePath}`;
      this.logger.error(
        errorMessage,
        {
          userId: command.userId,
          uploadPath: command.uploadPath,
          error: error.message,
        },
        error.stack,
      );
      throw new RssFileUploadError(errorMessage, { cause: error });
    }
  }

  /**
   * RSSファイルを削除する
   * @param command 削除要求コマンド
   */
  async delete(command: RssFileDeleteCommand): Promise<void> {
    this.logger.debug(`S3RssFileUploader.delete called`, {
      bucketName: command.bucketName,
      filePath: command.filePath,
    });

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: command.bucketName,
        Key: command.filePath,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log(`Cloudflare R2 からRSSファイル削除が完了しました`, {
        bucketName: command.bucketName,
        filePath: command.filePath,
      });
    } catch (error) {
      const errorMessage = `Cloudflare R2 からRSSファイル削除に失敗しました： ${command.filePath}`;
      this.logger.error(
        errorMessage,
        {
          bucketName: command.bucketName,
          filePath: command.filePath,
          error: error.message,
        },
        error.stack,
      );
      throw new RssFileUploadError(errorMessage, { cause: error });
    }
  }
}
