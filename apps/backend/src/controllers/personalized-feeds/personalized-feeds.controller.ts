import { AppConfigService } from '@/app-config/app-config.service';
import { BackendBearerTokenGuard } from '@/guards/bearer-token.guard';
import { IAppUsersRepository } from '@domains/app-user/app-users.repository.interface';
import { PersonalizedFeedsBuilder } from '@domains/radio-program/personalized-feed/personalized-feeds-builder';
import {
  Controller,
  HttpException,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
const fs = require('fs');
const path = require('path');
const util = require('util');

@Controller('personalized-feeds')
export class PersonalizedFeedsController {
  private readonly logger: Logger = new Logger(
    PersonalizedFeedsController.name,
  );

  // mastra: Mastra;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly personalizedFeedsBuilder: PersonalizedFeedsBuilder,
    @Inject('AppUsersRepository')
    private readonly appUsersRepository: IAppUsersRepository,
  ) {
    // const personalizedProgramWorkflow = new Workflow({
    //   name: 'personalizedProgramWorkflow',
    //   triggerSchema: z.object({
    //     userName: z.string().describe('ユーザー名'),
    //     posts: z.array(qiitaPostSchema).describe('記事のリスト'),
    //   }),
    //   mastra: new Mastra(),
    //   result: {
    //     schema: personalizedProgramScriptSchema,
    //   },
    // });
    // personalizedProgramWorkflow
    //   .step(createPersonalizedProgramScriptGenerationWorkflow)
    //   .commit();
    // this.mastra = new Mastra({
    //   workflows: { personalizedProgramWorkflow },
    //   agents: { qiitaPostSummarizeAgent },
    //   logger: createLogger({
    //     name: 'TechPostCastBackend',
    //     level: 'info',
    //   }),
    // });
  }

  @Post('/:userId')
  @ApiOperation({
    operationId: 'PersonalizedFeedsController.createProgram',
    summary:
      '指定ユーザーのパーソナルフィードに基づいた番組（パーソナルプログラム）を生成する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @UseGuards(BackendBearerTokenGuard)
  async createProgram(@Param('userId') userId: string): Promise<void> {
    this.logger.debug(`PersonalizedFeedsController.createProgram called`, {
      userId,
    });
    try {
      // ユーザーの存在確認
      const user = await this.appUsersRepository.findOne(userId);
      if (!user) {
        const errorMessage = `ユーザー [${user}] が見つかりませんでした`;
        this.logger.error(errorMessage, { userId: user });
        throw new NotFoundException(errorMessage);
      }
      const result = await this.personalizedFeedsBuilder.createProgramByUser(
        user,
        new Date(),
      );
      this.logger.debug(`実行結果: ${JSON.stringify(result)}`);
      // const id = `08bdfadfb760043f2183`;
      // // txt ファイルから content を取得
      // const content = await this.getContent();
      // const post: QiitaPost = {
      //   id,
      //   content,
      //   author: 'QiitaUser',
      //   tags: ['tag1', 'tag2'],
      //   createdAt: new Date().toISOString(),
      // };

      // const workflow = this.mastra.getWorkflow('personalizedProgramWorkflow');
      // const run = workflow.createRun();
      // const result = await run.start({
      //   triggerData: {
      //     posts: [post],
      //   },
      // });
      // this.logger.debug(
      //   `番組台本生成ワークフロー実行結果: ${JSON.stringify(result.results)}`,
      // );
    } catch (error) {
      const errorMessage = `番組台本生成中にエラーが発生しました`;
      this.logger.error(errorMessage, error);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(errorMessage);
    }
  }

  private async getContent() {
    const filePath = `/Users/sumihiro/projects/TechPostCast/tech-post-cast/apps/backend/src/controllers/personalized-feeds/content.txt`;
    const readFile = util.promisify(fs.readFile);
    // ファイルパスが正しいことを確認
    const absoluteFilePath = path.resolve(filePath);
    this.logger.debug(`Reading content from file: ${absoluteFilePath}`);
    // ファイルを非同期で読み込む
    const content = await readFile(absoluteFilePath, 'utf8');
    this.logger.debug(
      `File content loaded, length: ${content.length} characters`,
    );
    return content;
  }
}
