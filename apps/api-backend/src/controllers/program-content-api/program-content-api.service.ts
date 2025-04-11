import { HeadlineTopicProgramFindError } from '@/types/errors/headline-topic-program.error';
import { HeadlineTopicProgramWithSimilarAndNeighbors } from '@domains/radio-program/headline-topic-program';
import { IHeadlineTopicProgramsRepository } from '@domains/radio-program/headline-topic-program/headline-topic-programs.repository.interface';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { HeadlineTopicProgramsFindRequestDto } from './dto';

@Injectable()
export class ProgramContentApiService {
  private readonly logger = new Logger(ProgramContentApiService.name);

  constructor(
    @Inject('HeadlineTopicProgramsRepository')
    private readonly headlineTopicProgramsRepository: IHeadlineTopicProgramsRepository,
  ) {}

  /**
   * 指定 ID のヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組
   */
  async getHeadlineTopicProgram(
    id: string,
  ): Promise<HeadlineTopicProgramWithQiitaPosts> {
    this.logger.debug(
      'ProgramContentApiService.getHeadlineTopicProgram called',
      { id },
    );
    try {
      const result = await this.headlineTopicProgramsRepository.findOne(id);
      this.logger.debug(
        `指定のヘッドライントピック番組 [${id}] を取得しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, { cause: error });
    }
  }

  /**
   * 指定のヘッドライントピック番組と、その類似番組および、前後の日付の番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組と、その類似番組および、前後の日付の番組
   */
  async getHeadlineTopicProgramWithSimilarAndNeighbors(
    id: string,
  ): Promise<HeadlineTopicProgramWithSimilarAndNeighbors> {
    this.logger.debug(
      'ProgramContentApiService.getHeadlineTopicProgramWithSimilarAndNeighbors called',
      {
        id,
      },
    );
    try {
      const result =
        await this.headlineTopicProgramsRepository.findWithSimilarAndNeighbors(
          id,
        );
      this.logger.debug(
        `指定のヘッドライントピック番組 [${id}] と、その類似番組および、前後の日付の番組を取得しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      const errorMessage =
        'ヘッドライントピック番組と、その類似番組および、前後の日付の番組の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, { cause: error });
    }
  }

  /**
   * ヘッドライントピック番組の件数を取得する
   * @returns ヘッドライントピック番組の件数
   */
  async getHeadlineTopicProgramsCounts(): Promise<number> {
    this.logger.debug(
      'ProgramContentApiService.getHeadlineTopicProgramsCounts called',
    );
    try {
      const result = await this.headlineTopicProgramsRepository.count();
      this.logger.debug('ヘッドライントピック番組の件数を取得しました', {
        result,
      });
      return result;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の件数の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, { cause: error });
    }
  }

  /**
   * ヘッドライントピック番組一覧を取得する
   * @param dto リクエスト DTO
   * @returns ヘッドライントピック番組
   */
  async getHeadlineTopicPrograms(
    dto: HeadlineTopicProgramsFindRequestDto,
  ): Promise<HeadlineTopicProgramWithQiitaPosts[]> {
    this.logger.debug(
      'ProgramContentApiService.getHeadlineTopicPrograms called',
      { dto },
    );
    try {
      const result = await this.headlineTopicProgramsRepository.find(
        dto.page,
        dto.limit,
      );
      this.logger.debug('ヘッドライントピック番組を取得しました', { result });
      return result;
    } catch (error) {
      const errorMessage = 'ヘッドライントピック番組の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, { cause: error });
    }
  }

  /**
   * ヘッドライントピック番組のID一覧を取得する
   * @returns ヘッドライントピック番組のID一覧
   */
  async getHeadlineTopicProgramIds(): Promise<string[]> {
    this.logger.debug(
      'ProgramContentApiService.getHeadlineTopicProgramIds called',
    );
    try {
      const result = await this.headlineTopicProgramsRepository.findIds();
      this.logger.debug('ヘッドライントピック番組のID一覧を取得しました', {
        result,
      });
      return result;
    } catch (error) {
      const errorMessage =
        'ヘッドライントピック番組のID一覧の取得に失敗しました';
      this.logger.error(errorMessage, error, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, { cause: error });
    }
  }
}
