import { Controller, Get, Logger, Param } from '@nestjs/common';
import { QiitaPost } from '@prisma/client';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health-check')
  getHealthCheck(): string {
    this.logger.debug('health-check called!');
    return 'OK';
  }

  @Get('post/:postId')
  async getQiitaPost(@Param('postId') postId: string): Promise<QiitaPost> {
    return this.appService.getQiitaPost(postId);
  }
}
