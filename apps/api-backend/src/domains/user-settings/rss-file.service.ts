import { AppConfigService } from '@/app-config/app-config.service';
import { IPersonalizedProgramsRepository } from '@/domains/personalized-programs/personalized-programs.repository.interface';
import { RssFileGenerationError, RssFileUploadError } from '@/types/errors';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import {
  PersonalRssGenerator,
  RssGenerationOptions,
  RssProgram,
  RssUser,
} from '@tech-post-cast/commons';
import { unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  IRssFileUploader,
  RssFileUploadCommand,
} from './rss-file-uploader.interface';

/**
 * RSSファイル生成結果
 */
export interface RssFileGenerationResult {
  /** 生成されたRSS XML */
  xml: string;
  /** エピソード数 */
  episodeCount: number;
  /** 生成日時 */
  generatedAt: Date;
  /** 一時ファイルパス */
  tempFilePath: string;
}

/**
 * RSSファイルアップロード結果
 */
export interface RssFileUploadResult {
  /** アップロードされたRSS URL */
  rssUrl: string;
  /** エピソード数 */
  episodeCount: number;
  /** 生成日時 */
  generatedAt: Date;
}

/**
 * RSSファイルの生成とアップロードを管理するサービス
 */
@Injectable()
export class RssFileService {
  private readonly logger = new Logger(RssFileService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    @Inject('PersonalizedProgramsRepository')
    private readonly personalizedProgramsRepository: IPersonalizedProgramsRepository,
    @Inject('RssFileUploader')
    private readonly rssFileUploader: IRssFileUploader,
  ) {}

  /**
   * ユーザーのRSSファイルを生成する
   * @param appUser 対象ユーザー
   * @returns RSS生成結果
   * @throws RssFileGenerationError RSS生成に失敗した場合
   */
  async generateUserRssFile(
    appUser: AppUser,
  ): Promise<RssFileGenerationResult> {
    try {
      this.logger.log(`RSSファイル生成を開始します: ${appUser.id}`);

      if (!appUser.rssEnabled || !appUser.rssToken) {
        throw new RssFileGenerationError(
          `RSS機能が無効またはトークンが未設定です: ${appUser.id}`,
        );
      }

      // ユーザーのパーソナルプログラム一覧を取得（最新30件）
      const programsResult =
        await this.personalizedProgramsRepository.findByUserIdWithPagination(
          appUser.id,
          {
            limit: 30,
            offset: 0,
            orderBy: { createdAt: 'desc' },
          },
        );

      // RSSプログラム形式に変換
      const rssPrograms: RssProgram[] = programsResult.programs.map(
        (program) => ({
          id: program.id,
          title: program.title,
          audioUrl: program.audioUrl,
          audioDuration: program.audioDuration,
          createdAt: program.createdAt,
          imageUrl: program.imageUrl || undefined,
        }),
      );

      // RSSユーザー情報
      const rssUser: RssUser = {
        id: appUser.id,
        displayName: appUser.displayName,
        rssToken: appUser.rssToken,
      };

      // RSS生成オプション
      const options: RssGenerationOptions = {
        maxEpisodes: 30,
        baseUrl: this.appConfigService.LpBaseUrl,
        rssUrlPrefix: this.appConfigService.RssUrlPrefix,
        defaultImageUrl: this.appConfigService.PodcastImageUrl,
        authorEmail: this.appConfigService.PodcastAuthorEmail,
        authorName: this.appConfigService.PodcastAuthorName,
      };

      // RSSファイルを生成
      const rssResult = PersonalRssGenerator.generateUserRss(
        rssUser,
        rssPrograms,
        options,
      );

      // 一時ファイルに保存
      const tempFilePath = join(
        tmpdir(),
        `rss_${appUser.rssToken}_${Date.now()}.xml`,
      );
      await writeFile(tempFilePath, rssResult.xml, 'utf8');

      this.logger.log(
        `RSSファイル生成完了: ${appUser.id}, エピソード数: ${rssResult.episodeCount}`,
      );

      return {
        xml: rssResult.xml,
        episodeCount: rssResult.episodeCount,
        generatedAt: rssResult.generatedAt,
        tempFilePath,
      };
    } catch (error) {
      const errorMessage = `RSSファイル生成に失敗しました: ${appUser.id}`;
      this.logger.error(errorMessage, error);
      throw new RssFileGenerationError(errorMessage, { cause: error });
    }
  }

  /**
   * RSSファイルをCloudFlare R2にアップロードする
   * @param generationResult RSS生成結果
   * @param appUser 対象ユーザー
   * @returns アップロード結果
   * @throws RssFileUploadError アップロードに失敗した場合
   */
  async uploadRssFile(
    generationResult: RssFileGenerationResult,
    appUser: AppUser,
  ): Promise<RssFileUploadResult> {
    try {
      this.logger.log(`RSSファイルアップロードを開始します: ${appUser.id}`);

      if (!appUser.rssToken) {
        throw new RssFileUploadError(`RSSトークンが未設定です: ${appUser.id}`);
      }

      // アップロード先のパスを構築
      const bucketName = this.appConfigService.RssBucketName;
      const uploadPath = `u/${appUser.rssToken}/rss.xml`;

      // S3RssFileUploaderを使用してアップロード
      const uploadCommand: RssFileUploadCommand = {
        userId: appUser.id,
        rssToken: appUser.rssToken,
        bucketName,
        uploadPath,
        filePath: generationResult.tempFilePath,
      };

      const uploadResult = await this.rssFileUploader.upload(uploadCommand);

      this.logger.log(
        `RSSファイルアップロード完了: ${appUser.id}, URL: ${uploadResult.rssUrl}`,
      );

      return {
        rssUrl: uploadResult.rssUrl,
        episodeCount: generationResult.episodeCount,
        generatedAt: generationResult.generatedAt,
      };
    } catch (error) {
      const errorMessage = `RSSファイルアップロードに失敗しました: ${appUser.id}`;
      this.logger.error(errorMessage, error);
      throw new RssFileUploadError(errorMessage, { cause: error });
    } finally {
      // 一時ファイルを削除
      try {
        await unlink(generationResult.tempFilePath);
        this.logger.debug(
          `一時ファイルを削除しました: ${generationResult.tempFilePath}`,
        );
      } catch (unlinkError) {
        this.logger.warn(
          `一時ファイルの削除に失敗しました: ${generationResult.tempFilePath}`,
          unlinkError,
        );
      }
    }
  }

  /**
   * ユーザーのRSSファイルを生成してアップロードする
   * @param appUser 対象ユーザー
   * @returns アップロード結果
   * @throws RssFileGenerationError RSS生成に失敗した場合
   * @throws RssFileUploadError アップロードに失敗した場合
   */
  async generateAndUploadUserRss(
    appUser: AppUser,
  ): Promise<RssFileUploadResult> {
    let tempFilePath: string | undefined;

    try {
      this.logger.log(
        `RSSファイル生成・アップロードを開始します: ${appUser.id}`,
      );

      // RSSファイル生成
      const generationResult = await this.generateUserRssFile(appUser);
      tempFilePath = generationResult.tempFilePath;

      // RSSファイルアップロード
      const uploadResult = await this.uploadRssFile(generationResult, appUser);

      this.logger.log(`RSSファイル生成・アップロード完了: ${appUser.id}`);

      return uploadResult;
    } finally {
      // 一時ファイルのクリーンアップ
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
          this.logger.debug(`一時ファイルを削除しました: ${tempFilePath}`);
        } catch (error) {
          this.logger.warn(
            `一時ファイルの削除に失敗しました: ${tempFilePath}`,
            error,
          );
        }
      }
    }
  }

  /**
   * 指定されたRSSトークンのRSSファイルを削除する
   * @param rssToken 削除対象のRSSトークン
   * @param userId ユーザーID（ログ用）
   * @throws RssFileUploadError 削除に失敗した場合
   */
  async deleteUserRssFile(rssToken: string, userId?: string): Promise<void> {
    try {
      const logUserId = userId || 'unknown';
      this.logger.log(
        `RSSファイル削除を開始します: ${logUserId}, token: ${this.maskRssToken(rssToken)}`,
      );

      // 削除対象のパスを構築
      const bucketName = this.appConfigService.RssBucketName;
      const deletePath = `u/${rssToken}/rss.xml`;

      // RssFileUploaderを使用してファイル削除
      await this.rssFileUploader.delete({
        bucketName,
        filePath: deletePath,
      });

      this.logger.log(
        `RSSファイル削除完了: ${logUserId}, token: ${this.maskRssToken(rssToken)}`,
      );
    } catch (error) {
      const errorMessage = `RSSファイル削除に失敗しました: ${userId || 'unknown'}, token: ${this.maskRssToken(rssToken)}`;
      this.logger.error(errorMessage, error);
      throw new RssFileUploadError(errorMessage, { cause: error });
    }
  }

  /**
   * ログ出力用にRSSトークンをマスクする
   * @param rssToken マスクするRSSトークン
   * @returns マスクされたRSSトークン
   */
  private maskRssToken(rssToken: string): string {
    if (!rssToken || rssToken.length < 12) return '***';
    return `${rssToken.substring(0, 8)}***${rssToken.substring(rssToken.length - 4)}`;
  }
}
