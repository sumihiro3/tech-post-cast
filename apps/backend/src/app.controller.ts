import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { QiitaPost } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('post/:postId')
  async getQiitaPost(@Param('postId') postId: string): Promise<QiitaPost> {
    return this.appService.getQiitaPost(postId);
  }
}
