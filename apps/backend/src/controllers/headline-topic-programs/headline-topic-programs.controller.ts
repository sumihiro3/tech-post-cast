import {
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
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
  async createHeadlineTopicProgram(): Promise<void> {
    this.logger.debug(
      `HeadlineTopicProgramsController.createHeadlineTopicProgram called`,
    );
    try {
      // ヘッドライントピック番組を生成する
      await this.headlineTopicProgramsService.createHeadlineTopicProgram(
        new Date(),
      );
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
