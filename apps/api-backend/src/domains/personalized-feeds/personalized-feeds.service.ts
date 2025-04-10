import { Inject, Injectable, Logger } from '@nestjs/common';
import { PersonalizedFeedsResult } from './personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';

@Injectable()
export class PersonalizedFeedsService {
  private readonly logger = new Logger(PersonalizedFeedsService.name);

  constructor(
    @Inject('IPersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
  ) {}

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsResult> {
    this.logger.verbose('PersonalizedFeedsService.findByUserId', {
      userId,
      page,
      perPage,
    });

    return this.personalizedFeedsRepository.findByUserId(userId, page, perPage);
  }
}
