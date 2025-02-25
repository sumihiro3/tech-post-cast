import { IListenerLettersRepository } from '@domains/listener-letters/listener-letters.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram, ListenerLetter } from '@prisma/client';
import { PrismaService } from '@tech-post-cast/database';

/**
 * IListenerLettersRepository の実装クラス
 */
@Injectable()
export class ListenerLettersRepository implements IListenerLettersRepository {
  private readonly logger = new Logger(ListenerLettersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 番組で未紹介のお便りを取得する
   * 送信日時が古い順に取得する
   * @returns 未紹介のお便り
   */
  async findUnintroduced(): Promise<ListenerLetter> {
    this.logger.debug('ListenerLettersRepository.findUnintroduced called');
    const letter = await this.prisma.listenerLetter.findFirst({
      where: {
        programId: null,
      },
      orderBy: {
        sentAt: 'asc',
      },
    });
    return letter;
  }

  /**
   * 指定の番組で紹介されたお便りを取得する
   * @param program 紹介された番組
   * @returns 紹介されたお便り
   */
  findIntroduced(
    program: HeadlineTopicProgram,
  ): Promise<ListenerLetter | null> {
    this.logger.debug('ListenerLettersRepository.findIntroduced called', {
      id: program.id,
      title: program.title,
    });
    const letter = this.prisma.listenerLetter.findFirst({
      where: {
        programId: program.id,
      },
    });
    if (!letter) {
      return null;
    }
    this.logger.debug(
      `番組 [${program.title}] で紹介されたお便りを取得しました`,
      {
        letter,
      },
    );
    return letter;
  }

  /**
   * 指定のお便りを紹介済みにする
   * @param letters 紹介済みにするお便り
   * @param お便りを紹介した番組
   */
  async updateAsIntroduced(
    letter: ListenerLetter,
    program: HeadlineTopicProgram,
  ): Promise<void> {
    this.logger.debug('ListenerLettersRepository.updateAsIntroduced called', {
      programId: program.id,
      letter,
    });
    const updatedLetter = await this.prisma.listenerLetter.update({
      where: {
        id: letter.id,
      },
      data: {
        programId: program.id,
      },
    });
    this.logger.log(
      `お便り [${letter.id}] を番組 [${program.id}] で紹介済みにしました`,
      {
        updatedLetter,
      },
    );
  }
}
