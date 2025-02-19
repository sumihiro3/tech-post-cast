import { IListenerLettersRepository } from '@domains/listener-letters/listener-letters.repository.interface';
import { Logger, NotImplementedException } from '@nestjs/common';
import { HeadlineTopicProgram, ListenerLetter } from '@prisma/client';
import { PrismaService } from '@tech-post-cast/database';

/**
 * IListenerLettersRepository の実装クラス
 */
export class ListenerLettersRepository implements IListenerLettersRepository {
  private readonly logger = new Logger(ListenerLettersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 番組で未紹介のお便りを取得する
   * 送信日時が古い順に取得する
   * @returns 未紹介のお便り
   */
  async findUnintroduced(): Promise<ListenerLetter[]> {
    this.logger.debug('ListenerLettersRepository.findUnintroduced called');
    throw new NotImplementedException('Not implemented');
  }

  /**
   * 指定のお便りを紹介済みにする
   * @param letters 紹介済みにするお便り
   * @param お便りを紹介した番組
   */
  async updateAsIntroduced(
    letters: ListenerLetter[],
    program: HeadlineTopicProgram,
  ): Promise<void> {
    throw new NotImplementedException('Not implemented');
  }
}
