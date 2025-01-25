import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import {
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import {
  HeadlineTopicCreateRequestDto,
  HeadlineTopicRegenerateRequestDto,
} from './dto/headline-topic-programs.dto';
import { HeadlineTopicProgramsService } from './headline-topic-programs.service';

@Controller('headline-topic-programs')
export class HeadlineTopicProgramsController {
  private readonly logger = new Logger(HeadlineTopicProgramsController.name);

  constructor(
    private readonly headlineTopicProgramsService: HeadlineTopicProgramsService,
  ) {}

  /**
   * ヘッドライントピック番組を生成する
   */
  @Post()
  @ApiOperation({
    operationId: 'HeadlineTopicProgramsController.createProgram',
    summary: 'ヘッドライントピック番組を生成する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @UseGuards(BackendBearerTokenGuard)
  async createProgram(
    @Body() dto: HeadlineTopicCreateRequestDto,
  ): Promise<void> {
    this.logger.debug(`HeadlineTopicProgramsController.createProgram called`, {
      dto,
    });
    try {
      // ヘッドライントピック番組を生成する
      const programDate = dto.getProgramDate();
      this.logger.log(`ヘッドライントピック番組の生成を開始します`, {
        programDate,
      });
      const program =
        await this.headlineTopicProgramsService.createHeadlineTopicProgram(
          programDate,
          dto.updateLp,
        );
      this.logger.log(`ヘッドライントピック番組の生成が完了しました！`, {
        id: program.id,
        title: program.title,
      });
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * ヘッドライントピック番組を再生成する
   */
  @Patch()
  @ApiOperation({
    operationId: 'HeadlineTopicProgramsController.regenerateProgram',
    summary: 'ヘッドライントピック番組を再生成する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @UseGuards(BackendBearerTokenGuard)
  async regenerateProgram(
    @Body() dto: HeadlineTopicRegenerateRequestDto,
  ): Promise<void> {
    this.logger.debug(
      `HeadlineTopicProgramsController.regenerateProgram called`,
      { dto },
    );
    try {
      // ヘッドライントピック番組を再生成する
      const program =
        await this.headlineTopicProgramsService.regenerateHeadlineTopicProgram(
          dto.programId,
          dto.regenerationType,
          dto.updateLp,
        );
      this.logger.log(
        `ヘッドライントピック番組 [${program.id}] の再生成が完了しました！`,
        {
          id: program.id,
          title: program.title,
        },
      );
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の再生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
