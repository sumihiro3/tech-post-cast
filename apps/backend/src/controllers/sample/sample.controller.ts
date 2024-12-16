import { QiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import {
  HeadlineTopicProgramScript,
  PostSummary,
} from '@domains/radio-program/headline-topic-program';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import {
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';

@Controller('sample')
export class SampleController {
  private readonly logger = new Logger(SampleController.name);

  constructor(
    private readonly openAiApiClient: OpenAiApiClient,
    private readonly qiitaPostsApiClient: QiitaPostsApiClient,
  ) {}

  @Post('summary')
  async createSampleSummary(): Promise<PostSummary[]> {
    this.logger.debug(`SampleController.createSampleSummary called`);
    try {
      const programDate = new Date();
      const posts = await this.qiitaPostsApiClient.findQiitaPostsByDateRange(
        programDate,
        programDate,
      );
      this.logger.debug(`${posts.length} の記事を取得しました`);
      const post = posts[0];
      this.logger.debug(`記事の要約の生成を開始します`, { id: post.id });
      const summary = await this.openAiApiClient.summarizePost(post);
      this.logger.debug(`記事の要約を生成しました`, { summary });
      return [summary];
    } catch (error) {
      const errorMessage = `記事の要約の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post('script')
  async createSampleScript(): Promise<HeadlineTopicProgramScript> {
    this.logger.debug(`SampleController.createSampleScript called`);
    try {
      const programDate = new Date();
      const posts = await this.qiitaPostsApiClient.findQiitaPostsByDateRange(
        programDate,
        programDate,
      );
      this.logger.debug(`${posts.length} の記事を取得しました`);
      // ランダムに選んだ5件の記事を要約する
      const postCount = 5;
      const targetPosts = posts
        .sort(() => 0.5 - Math.random())
        .slice(0, postCount);
      const summarizedPosts: QiitaPostApiResponse[] = await Promise.all(
        targetPosts.map(async (post) => {
          this.logger.debug(`記事の要約の生成を開始します`, { id: post.id });
          const summary = await this.openAiApiClient.summarizePost(post);
          this.logger.debug(`記事の要約を生成しました`, { summary });
          post.summary = summary.summary;
          return post;
        }),
      );
      // 台本を作成する
      const script =
        await this.openAiApiClient.generateHeadlineTopicProgramScript(
          programDate,
          summarizedPosts,
        );
      this.logger.debug(`台本を生成しました`, { script });
      return script;
    } catch (error) {
      const errorMessage = `記事の要約の生成中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
