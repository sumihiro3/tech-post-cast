import { AppConfigService } from '@/app-config/app-config.service';
import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import {
  AppUserNotFoundError,
  PersonalizedFeedNotFoundError,
  PersonalizedProgramAlreadyExistsError,
} from '@/types/errors';
import { PersonalizedFeedsBuilder } from '@domains/radio-program/personalized-feed/personalized-feeds-builder';
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
import {
  ActiveFeedDto,
  GenerateProgramResponseDto,
  PersonalizedFeedCreateRequestDto,
} from './dto/personalized-feed.dto';

@Controller('personalized-feeds')
export class PersonalizedFeedsController {
  private readonly logger: Logger = new Logger(
    PersonalizedFeedsController.name,
  );

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly personalizedFeedsBuilder: PersonalizedFeedsBuilder,
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
      // パーソナルフィードIDを指定して番組生成を行う
      const { program, qiitaApiRateRemaining, qiitaApiRateReset } =
        await this.personalizedFeedsBuilder.buildProgramByFeed(
          dto.feedId,
          dto.getProgramDate(),
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
  async finalize(
    @Body()
    body: {
      totalFeeds: number;
      timestamp: number;
      successCount: number;
      failedFeedIds: string[];
    },
  ): Promise<void> {
    this.logger.debug(`PersonalizedFeedsController.finalize called`, {
      totalFeeds: body.totalFeeds,
      timestamp: body.timestamp,
      successCount: body.successCount,
      failedFeedIds: body.failedFeedIds,
    });
    const slackIncomingWebhookUrl =
      this.appConfigService.SlackIncomingWebhookUrl;
    if (!slackIncomingWebhookUrl) {
      this.logger.warn('Slack Incoming Webhook URL が設定されていません');
      return;
    }
    const failedFeedIds =
      body.failedFeedIds.length > 0
        ? body.failedFeedIds.join('\n    - ')
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
              text: `<!channel> パーソナルプログラムの一括生成処理が完了しました \n- 成功: ${body.successCount} 件 \n - 失敗: ${body.failedFeedIds.length} 件 \n- 失敗したパーソナルフィードID: \n    - ${failedFeedIds}`,
            },
          },
        ],
      }),
    });
  }
}
