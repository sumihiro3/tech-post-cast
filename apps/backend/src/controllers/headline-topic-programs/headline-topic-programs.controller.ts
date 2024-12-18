import {
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import { HeadlineTopicCreateRequestDto } from './dto/headline-topic-programs.dto';
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
    summary: '端末使用者を更新する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
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
}
