import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import {
  AppUserNotFoundError,
  PersonalizedFeedNotFoundError,
} from '@/types/errors';
import { PersonalizedFeedsBuilder } from '@domains/radio-program/personalized-feed/personalized-feeds-builder';
import {
  BadRequestException,
  Body,
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
        throw new NotFoundException(error.message);
      } else if (error instanceof AppUserNotFoundError) {
        throw new BadRequestException(error.message);
      } else {
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
  }
}
