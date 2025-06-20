import { AppConfigService } from '@/app-config/app-config.service';
import { IAppUsersRepository } from '@/domains/app-user/app-users.repository.interface';
import { IPersonalizedFeedsRepository } from '@/domains/radio-program/personalized-feed/personalized-feeds.repository.interface';
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
 * RSS一括生成結果
 */
export interface RssBatchResult {
  /** 成功件数 */
  successCount: number;
  /** 失敗件数 */
  failureCount: number;
  /** 失敗したユーザーID一覧 */
  failedUserIds: string[];
  /** 処理開始時刻 */
  startedAt: Date;
  /** 処理完了時刻 */
  completedAt: Date;
}

/**
 * パーソナルRSSの生成とアップロードを管理するサービス
 */
@Injectable()
export class PersonalRssService {
  private readonly logger = new Logger(PersonalRssService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    @Inject('AppUsersRepository')
    private readonly appUsersRepository: IAppUsersRepository,
    @Inject('PersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
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
      const programs =
        await this.personalizedFeedsRepository.findProgramsByUserId(
          appUser.id,
          30,
        );

      // RSSプログラム形式に変換
      const rssPrograms: RssProgram[] = programs.map((program) => ({
        id: program.id,
        title: program.title,
        audioUrl: program.audioUrl,
        audioDuration: program.audioDuration,
        createdAt: program.createdAt,
        imageUrl: program.imageUrl || undefined,
      }));

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
   * @param userId 対象ユーザーID
   * @returns アップロード結果
   * @throws RssFileGenerationError RSS生成に失敗した場合
   * @throws RssFileUploadError アップロードに失敗した場合
   */
  async generateAndUploadUserRss(userId: string): Promise<RssFileUploadResult> {
    let tempFilePath: string | undefined;

    try {
      this.logger.log(`RSSファイル生成・アップロードを開始します: ${userId}`);

      // ユーザー情報を取得
      const appUser = await this.appUsersRepository.findOne(userId);
      if (!appUser) {
        throw new RssFileGenerationError(`ユーザーが見つかりません: ${userId}`);
      }

      // RSSファイル生成
      const generationResult = await this.generateUserRssFile(appUser);
      tempFilePath = generationResult.tempFilePath;

      // RSSファイルアップロード
      const uploadResult = await this.uploadRssFile(generationResult, appUser);

      // ユーザーの RSS 配信時間を更新する
      await this.appUsersRepository.updateRssDeliveryTime(userId);

      this.logger.log(`RSSファイル生成・アップロード完了: ${userId}`);

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
   * RSS機能が有効な全ユーザーのRSSを一括生成・アップロードする
   * @returns 一括生成結果
   */
  async generateAndUploadAllUserRss(): Promise<RssBatchResult> {
    const startedAt = new Date();
    let successCount = 0;
    const failedUserIds: string[] = [];

    try {
      this.logger.log('RSS一括生成・アップロードを開始します');

      // RSS機能が有効なユーザー一覧を取得
      const rssEnabledUsers = await this.getRssEnabledUsers();
      this.logger.log(`RSS機能が有効なユーザー: ${rssEnabledUsers.length}件`);

      // 各ユーザーのRSSを並列で生成・アップロード
      const promises = rssEnabledUsers.map(async (user) => {
        try {
          await this.generateAndUploadUserRss(user.id);
          successCount++;
          this.logger.debug(`RSS生成成功: ${user.id}`);
        } catch (error) {
          failedUserIds.push(user.id);
          this.logger.error(`RSS生成失敗: ${user.id}`, error);
        }
      });

      await Promise.all(promises);

      const completedAt = new Date();
      const result: RssBatchResult = {
        successCount,
        failureCount: failedUserIds.length,
        failedUserIds,
        startedAt,
        completedAt,
      };

      this.logger.log('RSS一括生成・アップロード完了', {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalUsers: rssEnabledUsers.length,
        duration: completedAt.getTime() - startedAt.getTime(),
      });

      return result;
    } catch (error) {
      const errorMessage = 'RSS一括生成・アップロードでエラーが発生しました';
      this.logger.error(errorMessage, error);
      throw new RssFileGenerationError(errorMessage, { cause: error });
    }
  }

  /**
   * RSS機能が有効なユーザー一覧を取得する
   * @returns RSS機能が有効なユーザー一覧
   */
  async getRssEnabledUsers(): Promise<AppUser[]> {
    try {
      // RSS機能が有効（rssEnabled=true かつ rssToken が設定済み）なユーザーを取得
      const users = await this.appUsersRepository.findRssEnabledUsers();
      this.logger.debug(`RSS機能が有効なユーザー: ${users.length}件`);
      return users;
    } catch (error) {
      const errorMessage = 'RSS機能が有効なユーザーの取得に失敗しました';
      this.logger.error(errorMessage, error);
      throw new RssFileGenerationError(errorMessage, { cause: error });
    }
  }
}
