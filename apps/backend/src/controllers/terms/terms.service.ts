import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Injectable, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateTermRequestDto, TermDto } from './dto';

@Injectable()
export class TermsService {
  private readonly logger = new Logger(TermsService.name);

  constructor(private readonly termsRepository: TermsRepository) {}

  /**
   * 用語と読み方のペアを新規登録する
   * @param dto 用語と読み方のペアの新規登録リクエスト
   * @returns 登録した用語と読み方のペア
   */
  async createTerm(dto: CreateTermRequestDto): Promise<TermDto> {
    this.logger.debug(`${TermsService.name}.createTerm called`, { dto });
    try {
      // 用語と読み方のペアを新規登録する
      const term = await this.termsRepository.create(dto.term, dto.reading);
      this.logger.log(`用語と読み方のペアの新規登録が完了しました`, { term });
      const result = plainToClass(TermDto, term);
      return result;
    } catch (error) {
      const errorMessage = '用語と読み方のペアの新規登録に失敗しました';
      this.logger.error(errorMessage, error.message, error.stack);
      throw error;
    }
  }
}
