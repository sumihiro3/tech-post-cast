import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgramWithSimilarAndNeighborsDto } from '../dto';

/**
 * ヘッドライントピック番組サービス
 */
@Injectable()
export class HeadlineTopicProgramsService {
  private readonly logger = new Logger(HeadlineTopicProgramsService.name);

  constructor(
    private headlineTopicProgramsRepository: HeadlineTopicProgramsRepository,
  ) {}

  /**
   * ヘッドライントピック番組の一覧を取得する
   * @param skip スキップする番組数
   * @param limit 取得する番組数
   * @returns ヘッドライントピック番組の一覧
   */
  async findAll(page: number, limit: number) {
    this.logger.log(`findAll: page=${page}, limit=${limit}`);
    const result = await this.headlineTopicProgramsRepository.find(page, limit);
    return result;
  }

  /**
   * ヘッドライントピック番組の数を取得する
   * @returns ヘッドライントピック番組の数
   */
  async count() {
    this.logger.log('count');
    return this.headlineTopicProgramsRepository.count();
  }

  /**
   * 指定したIDのヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組ID
   * @returns ヘッドライントピック番組
   */
  async findById(id: string) {
    this.logger.log(`findById: id=${id}`);
    const result = await this.headlineTopicProgramsRepository.findOne(id);
    return result;
  }

  /**
   * ヘッドライントピック番組と、その類似番組および、前後の日付の番組を取得する
   * @param id ヘッドライントピック番組ID
   * @returns ヘッドライントピック番組と、その類似番組および、前後の日付の番組
   */
  async findByIdWithSimilarAndNeighbors(id: string) {
    this.logger.log(`findByIdWithSimilarAndNeighbors: id=${id}`);
    const result =
      await this.headlineTopicProgramsRepository.findWithSimilarAndNeighbors(
        id,
      );
    return HeadlineTopicProgramWithSimilarAndNeighborsDto.createFromEntity(
      result,
    );
  }
}
