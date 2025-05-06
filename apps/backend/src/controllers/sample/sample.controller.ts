import { IAppUsersRepository } from '@domains/app-user/app-users.repository.interface';
import { QiitaPostApiResponse } from '@domains/qiita-posts/qiita-posts.entity';
import {
  HeadlineTopicProgramScript,
  PostSummary,
} from '@domains/radio-program/headline-topic-program';
import { PersonalizedFeedFilterMapper } from '@domains/radio-program/personalized-feed/personalized-feed-filter.mapper';
import { IPersonalizedFeedsRepository } from '@domains/radio-program/personalized-feed/personalized-feeds.repository.interface';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { S3ProgramFileUploader } from '@infrastructure/external-api/aws/s3';
import { OpenAiApiClient } from '@infrastructure/external-api/openai-api/openai-api.client';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
} from '@nestjs/common';

@Controller('sample')
export class SampleController {
  private readonly logger = new Logger(SampleController.name);

  constructor(
    private readonly openAiApiClient: OpenAiApiClient,
    private readonly qiitaPostsApiClient: QiitaPostsApiClient,
    @Inject('ProgramFileUploader')
    private readonly s3ProgramFileUploader: S3ProgramFileUploader,
    private readonly headlineTopicProgramsRepository: HeadlineTopicProgramsRepository,
    @Inject('PersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
    @Inject('AppUsersRepository')
    private readonly appUsersRepository: IAppUsersRepository,
    private readonly personalizedFeedFilterMapper: PersonalizedFeedFilterMapper,
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

  @Post('vectorize-script/:id')
  async vectorizeScript(@Param('id') id: string) {
    this.logger.debug(`SampleController.vectorizeScript called`, {
      id,
    });
    try {
      const program = await this.headlineTopicProgramsRepository.findOne(id);
      this.logger.debug(`番組情報を取得しました`, {
        id: program.id,
        title: program.title,
      });
      const vector =
        await this.openAiApiClient.vectorizeHeadlineTopicProgramScript(program);
      // ベクトルデータ化結果のダミー
      // const vector: VectorizeResult = {
      //   model: 'gpt-3.5-turbo',
      //   totalTokens: 1000,
      //   vector: [0.888, 0.2, 0.3, 0.4, 0.5],
      // };
      this.logger.debug(`番組台本のベクトルデータ化が完了しました`, { vector });
      const result =
        await this.headlineTopicProgramsRepository.setHeadlineTopicProgramScriptVector(
          program.id,
          vector,
        );
      this.logger.debug(`番組台本のベクトルデータを登録しました`, { result });
      return {
        message: `番組台本のベクトルデータ化が完了しました`,
        vector: {
          id: program.id,
          title: program.title,
          model: vector.model,
          tokens: vector.totalTokens,
        },
      };
    } catch (error) {
      const errorMessage = `番組台本のベクトルデータ化中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('find-similar-programs/:id')
  async findSimilarPrograms(@Param('id') id: string) {
    this.logger.debug(`SampleController.findSimilarPrograms called`, {
      id,
    });
    try {
      const program = await this.headlineTopicProgramsRepository.findOne(id);
      this.logger.debug(`番組情報を取得しました`, {
        id: program.id,
        title: program.title,
      });
      const similarPrograms =
        await this.headlineTopicProgramsRepository.findSimilarPrograms(
          program.id,
        );
      this.logger.debug(`${similarPrograms.length} 件の類似番組を取得しました`);
      return similarPrograms;
    } catch (error) {
      const errorMessage = `類似番組の取得中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post('upload')
  async uploadSampleProgram() {
    this.logger.debug(`SampleController.uploadSampleProgram called`);
    // ここにファイルアップロード処理を実装する
    const filePath = 'tmp/script.txt';
    const result = await this.s3ProgramFileUploader.upload({
      programId: 'sample-program',
      programDate: new Date(),
      bucketName: 'tech-post-cast-program-audio-bucket-develop',
      uploadPath: 'sample-program/script.txt',
      filePath,
    });
    this.logger.log(`ファイルアップロードが完了しました`, { result });
  }

  @Get('personalized-feed/:id')
  async getQiitaPostsByUserPersonalizedFeed(@Param('id') userId: string) {
    this.logger.debug(
      `SampleController.getQiitaPostsByUserPersonalizedFeed called`,
      {
        userId,
      },
    );
    try {
      const user = await this.appUsersRepository.findOne(userId);
      if (!user) {
        const errorMessage = `指定されたユーザーは存在しません`;
        this.logger.error(errorMessage, { userId });
        throw new InternalServerErrorException(errorMessage);
      }
      this.logger.debug(`ユーザー情報を取得しました`, { user });
      // ユーザーのパーソナルフィードを取得する
      const personalizedFeeds =
        await this.personalizedFeedsRepository.findActiveByUser(user);
      this.logger.debug(
        `${personalizedFeeds.length} 件のパーソナルフィードを取得しました`,
        { personalizedFeeds },
      );
      const feed = personalizedFeeds[0];
      const findOptions =
        this.personalizedFeedFilterMapper.buildQiitaFilterOptions(feed);
      const posts =
        await this.qiitaPostsApiClient.findQiitaPostsByPersonalizedFeed(
          findOptions,
        );
      this.logger.debug(`${posts.length} 件のQiita記事を取得しました`);
      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        author: post.user,
        createdAt: post.created_at,
        tags: post.tags,
      }));
    } catch (error) {
      const errorMessage = `パーソナルフィードの取得中にエラーが発生しました`;
      this.logger.error(errorMessage, { error }, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
