import { AppConfigService } from '@/app-config/app-config.service';
import { FileUploaderError } from '@/types/errors';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  IProgramFileUploader,
  ProgramFileUploadCommand,
} from '@domains/radio-program/file-uploader.interface';
import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

/**
 * 生成した番組ファイルをクラウドストレージ（AWS S3）にアップロードする機能を提供する
 */
@Injectable()
export class S3ProgramFileUploader implements IProgramFileUploader {
  private readonly logger = new Logger(S3ProgramFileUploader.name);

  private s3Client: S3Client;

  constructor(private readonly appConfig: AppConfigService) {
    this.s3Client = this.createS3Client();
  }

  /**
   * S3クライアントを生成する
   */
  createS3Client(): S3Client {
    return new S3Client({});
  }

  /*
   * 番組ファイルをアップロードする
   * @param command アップロード要求コマンド
   */
  async upload(command: ProgramFileUploadCommand): Promise<string> {
    this.logger.debug(`S3ProgramFileUploader.upload called`, {
      command,
    });
    try {
      this.logger.debug(`ファイルアップロードを開始します`, { command });
      const s3UploadCommand = new PutObjectCommand({
        Bucket: command.bucketName,
        Key: command.uploadPath,
        Body: await readFile(command.filePath),
      });
      const uploadResult = await this.s3Client.send(s3UploadCommand);
      // アップロードしたファイルのURL
      const urlPrefix = this.appConfig.ProgramAudioFileUrlPrefix;
      const uploadedUrl = `${urlPrefix}/${command.uploadPath}`;
      this.logger.log(`S3 にファイルアップロードが完了しました`, {
        response: uploadResult,
        url: uploadedUrl,
      });
      return uploadedUrl;
    } catch (error) {
      const errorMessage = `S3 へのファイルアップロードに失敗しました： ${command.filePath}`;
      this.logger.error(
        errorMessage,
        {
          command,
          error,
        },
        error.stack,
      );
      throw new FileUploaderError(errorMessage, { cause: error });
    }
  }
}
