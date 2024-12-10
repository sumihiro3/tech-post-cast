import {
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { HeadlineTopicProgramsService } from '../headline-topic-programs/headline-topic-programs.service';

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly headlineTopicProgramsService: HeadlineTopicProgramsService,
  ) {}

  /**
   * Lambda Web Adapter での `Non-HTTP Event Triggers` によるイベントを受信するエンドポイント
   * @see https://github.com/awslabs/aws-lambda-web-adapter?tab=readme-ov-file#non-http-event-triggers
   * @param request HTTP request object
   */
  @Post()
  async receiveEvents(@Req() request: Request) {
    this.logger.log('Received event', { request: request.body });
    try {
      const programDate = new Date();
      this.logger.log(`ヘッドライントピック番組の定期生成を開始します`, {
        programDate,
      });
      await this.headlineTopicProgramsService.createHeadlineTopicProgram(
        programDate,
      );
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
