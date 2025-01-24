import { AppConfigService } from '@/app-config/app-config.service';
import { TwitterApiError } from '@/types/errors';
import { Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram } from '@prisma/client';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterApiClient {
  private readonly logger = new Logger(TwitterApiClient.name);

  private readonly client: TwitterApi;

  constructor(private readonly appConfig: AppConfigService) {
    if (!this.appConfig.PostToX) {
      this.logger.log(
        `X へのポスト設定が無効になっているため、TwitterApiClient は初期化されません`,
      );
      return;
    }
    this.client = new TwitterApi({
      appKey: this.appConfig.XApiKey,
      appSecret: this.appConfig.XApiSecret,
      accessToken: this.appConfig.XApiAccessToken,
      accessSecret: this.appConfig.XApiAccessSecret,
    });
  }

  /**
   * 新しいヘッドライントピック番組が配信されたことを X にポストする
   * @param program ヘッドライントピック番組
   */
  async postNewHeadlineTopicProgram(
    program: HeadlineTopicProgram,
  ): Promise<void> {
    this.logger.debug(`TwitterApiClient.postNewHeadlineTopicProgram called`, {
      program,
    });
    try {
      if (!this.appConfig.PostToX) {
        this.logger.log(
          `X へのポスト設定が無効になっているため、X へのポストはスキップします`,
          {
            program: program.id,
          },
        );
        return;
      }
      const lpBaseUrl = this.appConfig.LpBaseUrl;
      const programPageUrl = `${lpBaseUrl}/headline-topic-programs/${program.id}`;
      const tweet = `おはようございます！\n最新のヘッドライントピック『${program.title}』が配信されました！ぜひご視聴ください！！\n\n#TechPostCast #Qiita\n\n${programPageUrl}`;
      this.logger.debug(`最新のヘッドライントピック配信用ポストを送信します`, {
        tweet,
      });
      // ポスト送信
      await this.client.v2.tweet(tweet);
      this.logger.log(`最新のヘッドライントピック配信用ポストを送信しました`, {
        tweet,
        program: program.id,
      });
    } catch (e) {
      const errorMessage = `最新のヘッドライントピック配信用ポストの送信に失敗しました`;
      this.logger.error(errorMessage, e.message, e.stack);
      throw new TwitterApiError(errorMessage, { cause: e });
    }
  }
}
