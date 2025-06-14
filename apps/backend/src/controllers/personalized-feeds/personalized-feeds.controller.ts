import { AppConfigService } from '@/app-config/app-config.service';
import { PersonalRssService } from '@/domains/rss/personal-rss.service';
import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import {
  AppUserNotFoundError,
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAlreadyExistsError,
  RssFileGenerationError,
  RssFileUploadError,
} from '@/types/errors';
import { PersonalizedFeedsBuilder } from '@domains/radio-program/personalized-feed/personalized-feeds-builder';
import { PersonalizedProgramAttemptsService } from '@domains/radio-program/personalized-feed/personalized-program-attempts.service';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { formatDate } from '@tech-post-cast/commons';
import {
  ActiveFeedDto,
  FinalizeRequestDto,
  GenerateProgramResponseDto,
  PersonalizedFeedCreateRequestDto,
  RssBatchGenerateRequestDto,
  RssBatchGenerateResponseDto,
  RssUserGenerateRequestDto,
  RssUserGenerateResponseDto,
} from './dto/personalized-feed.dto';

@Controller('personalized-feeds')
export class PersonalizedFeedsController {
  private readonly logger: Logger = new Logger(
    PersonalizedFeedsController.name,
  );

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly personalizedFeedsBuilder: PersonalizedFeedsBuilder,
    private readonly personalRssService: PersonalRssService,
    private readonly personalizedProgramAttemptsService: PersonalizedProgramAttemptsService,
  ) {}

  @Get('/active-feeds')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.getActiveFeeds',
    summary: 'アクティブなパーソナルフィード一覧を取得する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'アクティブなパーソナルフィードIDの一覧を取得する',
    type: [ActiveFeedDto],
  })
  @UseGuards(BackendBearerTokenGuard)
  async getActiveFeeds(): Promise<ActiveFeedDto[]> {
    this.logger.debug(`PersonalizedFeedsController.getActiveFeeds called`);
    try {
      const activeFeeds = await this.personalizedFeedsBuilder.getActiveFeeds();
      this.logger.log(
        `[${activeFeeds.length}] 件のアクティブなパーソナルフィードを取得しました`,
      );
      return activeFeeds.map((feed) => {
        const dto = new ActiveFeedDto();
        dto.id = feed.id;
        return dto;
      });
    } catch (error) {
      const errorMessage = `パーソナルフィード一覧取得中にエラーが発生しました`;
      this.logger.error(errorMessage, error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post('/generate-program')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.generateProgram',
    summary:
      '指定されたパーソナルフィードに基づいた番組（パーソナルプログラム）を生成する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '番組生成結果を返す',
    type: GenerateProgramResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '番組がすでに生成されている場合',
  })
  @ApiResponse({
    status: 404,
    description: 'パーソナルフィードが見つからない場合',
  })
  @ApiResponse({
    status: 400,
    description: 'パラメーターが不正な場合',
  })
  @UseGuards(BackendBearerTokenGuard)
  async generateProgramByFeed(
    @Body() dto: PersonalizedFeedCreateRequestDto,
  ): Promise<GenerateProgramResponseDto> {
    this.logger.debug(
      `PersonalizedFeedsController.generateProgramByFeed called`,
      {
        dto,
      },
    );
    try {
      const programDate = dto.getProgramDate();
      // パーソナルフィードIDを指定して番組生成を行う
      const { program, qiitaApiRateRemaining, qiitaApiRateReset } =
        await this.personalizedFeedsBuilder.buildProgramByFeed(
          dto.feedId,
          programDate,
        );
      this.logger.log(
        `パーソナルフィード [${dto.feedId}] に基づいた番組を生成しました`,
        {
          programId: program.id,
          title: program.title,
          qiitaApiRateRemaining,
          qiitaApiRateReset,
        },
      );
      const responseDto = new GenerateProgramResponseDto();
      responseDto.programId = program.id;
      responseDto.qiitaApiRateRemaining = qiitaApiRateRemaining;
      responseDto.qiitaApiRateReset = qiitaApiRateReset;
      responseDto.generatedAt = programDate.toISOString();
      return responseDto;
    } catch (error) {
      const errorMessage = `番組生成中にエラーが発生しました`;
      this.logger.error(errorMessage, error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      if (error instanceof HttpException) throw error;
      if (error instanceof PersonalizedFeedNotFoundError) {
        // パーソナルフィードが見つからない場合は、NotFound とする
        throw new NotFoundException(error.message);
      } else if (error instanceof AppUserNotFoundError) {
        // ユーザーが見つからない場合は、BadRequest とする
        throw new BadRequestException(error.message);
      } else if (error instanceof PersonalizedProgramAlreadyExistsError) {
        // 番組がすでに生成されている場合は、Conflict とする
        throw new ConflictException(error.message);
      } else {
        // その他のエラーは、InternalServerError とする
        throw new InternalServerErrorException(errorMessage);
      }
    }
  }

  @Post('/notify-error')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.notifyError',
    summary: 'エラー通知を送信する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'エラー通知を受信したことを返す',
  })
  @UseGuards(BackendBearerTokenGuard)
  async notifyError(
    @Body() body: { feedId: string; error: any },
  ): Promise<void> {
    this.logger.debug(`PersonalizedFeedsController.notifyError called`, {
      feedId: body.feedId,
      error: body.error,
    });
    const slackIncomingWebhookUrl =
      this.appConfigService.SlackIncomingWebhookUrl;
    if (!slackIncomingWebhookUrl) {
      this.logger.warn('Slack Incoming Webhook URL が設定されていません');
      return;
    }
    // Slack に通知する
    await fetch(slackIncomingWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        username: 'パーソナルフィード生成エラー通知',
        icon_emoji: ':ghost:',
        text: `パーソナルフィード [${body.feedId}] に基づいた番組の生成に失敗しました`,
      }),
    });
  }

  @Post('/finalize')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.finalize',
    summary: '終了通知を送信する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '終了通知を受信したことを返す',
  })
  @UseGuards(BackendBearerTokenGuard)
  async finalize(@Body() dto: FinalizeRequestDto): Promise<void> {
    this.logger.debug(`PersonalizedFeedsController.finalize called`, {
      dto,
    });

    try {
      // PersonalizedProgramAttemptsServiceから統計を取得
      const daysAgo = dto.daysAgo ?? 0;
      const stats =
        await this.personalizedProgramAttemptsService.getGenerationStatsByDaysAgo(
          daysAgo,
        );

      this.logger.log('番組生成統計を取得しました', {
        totalFeeds: stats.totalFeeds,
        successCount: stats.successCount,
        skippedCount: stats.skippedCount,
        failedCount: stats.failedFeedIds.length,
        daysAgo,
        programDate: formatDate(dto.getTargetDate(), 'YYYY/MM/DD'),
      });

      const slackIncomingWebhookUrl =
        this.appConfigService.SlackIncomingWebhookUrl;
      if (!slackIncomingWebhookUrl) {
        this.logger.warn('Slack Incoming Webhook URL が設定されていません');
        return;
      }

      const failedFeedIds =
        stats.failedFeedIds.length > 0
          ? stats.failedFeedIds.join('\n    - ')
          : '（なし）';

      // Slack に通知する
      await fetch(slackIncomingWebhookUrl, {
        method: 'POST',
        body: JSON.stringify({
          icon_emoji: ':microphone:',
          blocks: [
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'emoji',
                      name: 'tada',
                    },
                  ],
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `<!channel> パーソナルプログラムの一括生成処理が完了しました \n- 成功: ${stats.successCount} 件 \n- スキップ: ${stats.skippedCount} 件 \n- 失敗: ${stats.failedFeedIds.length} 件 \n- 失敗したパーソナルフィードID: \n    - ${failedFeedIds}`,
              },
            },
          ],
        }),
      });
    } catch (error) {
      const errorMessage = `終了通知処理中にエラーが発生しました`;
      this.logger.error(errorMessage, error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post('/rss/generate-all')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.generateAllUserRss',
    summary: 'RSS機能が有効な全ユーザーのRSSを一括生成・アップロードする',
    description:
      'RSS機能が有効な全ユーザーのパーソナルプログラムからRSSファイルを生成し、CloudFlare R2にアップロードします。',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'RSS一括生成結果を返す',
    type: RssBatchGenerateResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'RSS一括生成処理でエラーが発生した場合',
  })
  @UseGuards(BackendBearerTokenGuard)
  async generateAllUserRss(
    @Body() dto: RssBatchGenerateRequestDto,
  ): Promise<RssBatchGenerateResponseDto> {
    this.logger.debug(`PersonalizedFeedsController.generateAllUserRss called`, {
      dto,
    });
    try {
      const result =
        await this.personalRssService.generateAndUploadAllUserRss();

      this.logger.log('RSS一括生成・アップロード完了', {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalUsers: result.successCount + result.failureCount,
        duration: result.completedAt.getTime() - result.startedAt.getTime(),
      });

      // Slack通知
      await this.notifyRssBatchResult(result);

      const responseDto = new RssBatchGenerateResponseDto();
      responseDto.successCount = result.successCount;
      responseDto.failureCount = result.failureCount;
      responseDto.failedUserIds = result.failedUserIds;
      responseDto.startedAt = result.startedAt.toISOString();
      responseDto.completedAt = result.completedAt.toISOString();
      responseDto.durationMs =
        result.completedAt.getTime() - result.startedAt.getTime();

      return responseDto;
    } catch (error) {
      const errorMessage = `RSS一括生成・アップロード中にエラーが発生しました`;
      this.logger.error(errorMessage, error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      if (error instanceof HttpException) throw error;
      if (
        error instanceof RssFileGenerationError ||
        error instanceof RssFileUploadError
      ) {
        throw new InternalServerErrorException(error.message);
      } else {
        throw new InternalServerErrorException(errorMessage);
      }
    }
  }

  @Post('/rss/generate-user')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.generateUserRss',
    summary: '指定ユーザーのRSSを生成・アップロードする',
    description:
      '指定されたユーザーのパーソナルプログラムからRSSファイルを生成し、CloudFlare R2にアップロードします。',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'RSS生成結果を返す',
    type: RssUserGenerateResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ユーザーが見つからない場合',
  })
  @ApiResponse({
    status: 400,
    description: 'RSS機能が無効またはトークンが未設定の場合',
  })
  @ApiResponse({
    status: 500,
    description: 'RSS生成処理でエラーが発生した場合',
  })
  @UseGuards(BackendBearerTokenGuard)
  async generateUserRss(
    @Body() dto: RssUserGenerateRequestDto,
  ): Promise<RssUserGenerateResponseDto> {
    this.logger.debug(`PersonalizedFeedsController.generateUserRss called`, {
      dto,
    });
    try {
      const result = await this.personalRssService.generateAndUploadUserRss(
        dto.userId,
      );

      this.logger.log(`ユーザーRSS生成・アップロード完了: ${dto.userId}`, {
        rssUrl: result.rssUrl,
        episodeCount: result.episodeCount,
      });

      const responseDto = new RssUserGenerateResponseDto();
      responseDto.userId = dto.userId;
      responseDto.rssUrl = result.rssUrl;
      responseDto.episodeCount = result.episodeCount;
      responseDto.generatedAt = result.generatedAt.toISOString();

      return responseDto;
    } catch (error) {
      const errorMessage = `ユーザーRSS生成・アップロード中にエラーが発生しました: ${dto.userId}`;
      this.logger.error(errorMessage, error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      if (error instanceof HttpException) throw error;
      if (error instanceof AppUserNotFoundError) {
        throw new NotFoundException(`ユーザーが見つかりません: ${dto.userId}`);
      } else if (error instanceof RssFileGenerationError) {
        // RSS機能が無効またはトークンが未設定の場合
        if (error.message.includes('RSS機能が無効またはトークンが未設定')) {
          throw new BadRequestException(error.message);
        } else {
          throw new InternalServerErrorException(error.message);
        }
      } else if (error instanceof RssFileUploadError) {
        throw new InternalServerErrorException(error.message);
      } else {
        throw new InternalServerErrorException(errorMessage);
      }
    }
  }

  /**
   * RSS一括生成結果をSlackに通知する
   * @param result RSS一括生成結果
   */
  private async notifyRssBatchResult(result: any): Promise<void> {
    const slackIncomingWebhookUrl =
      this.appConfigService.SlackIncomingWebhookUrl;
    if (!slackIncomingWebhookUrl) {
      this.logger.warn('Slack Incoming Webhook URL が設定されていません');
      return;
    }

    const totalUsers = result.successCount + result.failureCount;
    const durationSec = Math.round(
      (result.completedAt.getTime() - result.startedAt.getTime()) / 1000,
    );
    const failedUserIds =
      result.failedUserIds.length > 0
        ? result.failedUserIds.join('\n    - ')
        : '（なし）';

    try {
      await fetch(slackIncomingWebhookUrl, {
        method: 'POST',
        body: JSON.stringify({
          icon_emoji: ':rss:',
          blocks: [
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'emoji',
                      name: 'rss',
                    },
                  ],
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `RSS一括生成・アップロード処理が完了しました\n- 対象ユーザー: ${totalUsers} 件\n- 成功: ${result.successCount} 件\n- 失敗: ${result.failureCount} 件\n- 処理時間: ${durationSec} 秒\n- 失敗したユーザーID:\n    - ${failedUserIds}`,
              },
            },
          ],
        }),
      });
    } catch (error) {
      this.logger.error('Slack通知の送信に失敗しました', error);
    }
  }
}
