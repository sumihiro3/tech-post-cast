import { AppConfigService } from '@/app-config/app-config.service';
import { QiitaPostsRepository } from '@infrastructure/database/qiita-posts/qiita-posts.repository';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PersonalizedFeedProgram } from '@prisma/client';

@Injectable()
export class PersonalizedFeedsService {
  private readonly logger = new Logger(PersonalizedFeedsService.name);

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly qiitaPostsRepository: QiitaPostsRepository,
    private readonly qiitaPostsApiClient: QiitaPostsApiClient,
  ) {}

  /**
   * パーソナルフィードの設定に基づいた最新の番組を生成する
   * @param personalizedFeedId パーソナルフィードの ID
   * @param programDate 番組日
   * @returns 生成した番組
   */
  async createPersonalizedFeedProgram(
    personalizedFeedId: string,
    programDate: Date,
  ): Promise<PersonalizedFeedProgram> {
    this.logger.debug(
      `PersonalizedFeedsService.createPersonalizedFeedProgram called`,
      {
        personalizedFeedId,
        programDate,
      },
    );
    // TODO パーソナルフィード（番組設定）を取得する
    // TODO パーソナルフィードの設定に合致した Qiita 記事を取得する
    // TODO 指定のパーソナルフィードの番組で扱っていない記事だけに絞り込む
    // TODO パーソナルフィードの記事の優先度を考慮して記事をソートする
    // TODO パーソナルフィード番組を生成する
    // TODO パーソナルフィード番組が生成されたことを通知する
    // TODO Not implemented yet
    throw new NotImplementedException(
      'createPersonalizedFeedProgram メソッドは未実装です。パーソナルフィードの設定に基づいた最新の番組を生成する処理を実装してください。',
    );
  }
}
