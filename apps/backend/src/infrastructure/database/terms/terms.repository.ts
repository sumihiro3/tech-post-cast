import { ITermsRepository } from '@domains/terms/terms.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { Term } from '@prisma/client';
import { PrismaService } from '@tech-post-cast/database';

/**
 * ITermsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class TermsRepository implements ITermsRepository {
  private readonly logger = new Logger(TermsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 用語と読み方のペアを取得する
   */
  async find(): Promise<Term[]> {
    this.logger.debug(`${TermsRepository.name}.find called`);
    const result = await this.prisma.term.findMany();
    this.logger.log(`用語と読み方のペアを取得しました`, { result });
    return result;
  }

  /**
   * 用語と読み方のペアを新規登録する
   * @param term 用語
   * @param reading 読み方
   * @returns 登録した用語と読み方のペア
   */
  async create(term: string, reading: string): Promise<Term> {
    this.logger.debug(`${TermsRepository.name}.create called`, {
      term,
      reading,
    });
    const result = await this.prisma.term.create({
      data: {
        term,
        reading,
      },
    });
    this.logger.log(`用語と読み方のペアを新規登録しました`, { result });
    return result;
  }
}
