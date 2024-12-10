import { IHeadlineTopicProgramsRepository } from '@/domains/radio-program/headline-topic-program/headline-topic-programs.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram, Prisma, QiitaPost } from '@prisma/client';
import { PrismaService } from '@tech-post-cast/database';
import { HeadlineTopicProgramGenerateResult } from '../../../domains/radio-program/headline-topic-program';

/**
 * IHeadlineTopicProgramsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class HeadlineTopicProgramsRepository
  implements IHeadlineTopicProgramsRepository
{
  private readonly logger = new Logger(HeadlineTopicProgramsRepository.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * 指定 ID のヘッドライントピック番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組
   */
  async findOne(id: string): Promise<HeadlineTopicProgram> {
    this.logger.debug(`HeadlineTopicProgramsRepository.findOne called`, { id });
    const result = await this.prisma.headlineTopicProgram.findUnique({
      where: { id },
    });
    this.logger.debug(`指定のヘッドライントピック番組 [${id}] を取得しました`, {
      result,
    });
    return result;
  }

  /**
   * ヘッドライントピック番組を新規登録または更新する
   * @param programDate 番組日時
   * @param posts 番組での紹介記事 一覧
   * @param audioFileGenerateResult 音声ファイルの生成結果
   * @param audioFileUrl 音声ファイルの URL
   */
  async upsertHeadlineTopicProgram(
    programDate: Date,
    posts: QiitaPost[],
    audioFileGenerateResult: HeadlineTopicProgramGenerateResult,
    audioFileUrl: string,
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.upsertHeadlineTopicProgram called`,
      {
        audioFileGenerateResult,
        audioFileUrl,
      },
    );
    const result: HeadlineTopicProgram =
      await this.prisma.headlineTopicProgram.upsert(
        this.createUpsertQuery(
          programDate,
          posts,
          audioFileGenerateResult,
          audioFileUrl,
        ),
      );
    this.logger.debug(`ヘッドライントピック番組を登録または更新しました`, {
      result,
    });
    return result;
  }

  /**
   * ヘッドライントピック番組の新規登録または更新クエリを生成する
   * @param programDate 番組日時
   * @param posts 紹介記事一覧
   * @param audioFileGenerateResult 音声ファイルの生成結果
   * @param audioFileUrl 音声ファイルの URL
   * @returns ヘッドライントピック番組の新規登録または更新クエリ
   */
  private createUpsertQuery(
    programDate: Date,
    posts: QiitaPost[],
    audioFileGenerateResult: HeadlineTopicProgramGenerateResult,
    audioFileUrl: string,
  ): Prisma.HeadlineTopicProgramUpsertArgs {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.createUpsertQuery called`,
      {
        audioFileGenerateResult,
        audioFileUrl,
      },
    );
    const scriptString = JSON.stringify(audioFileGenerateResult.script);
    const update = {
      title: audioFileGenerateResult.script.title,
      script: scriptString as Prisma.InputJsonValue,
      audioUrl: audioFileUrl,
      audioDuration: audioFileGenerateResult.duration,
      posts: {
        connect: posts.map((post) => ({ id: post.id })),
      },
      createdAt: programDate,
      updatedAt: new Date(),
    };
    const create = { ...update, id: undefined };
    return {
      where: { id: '' },
      create,
      update,
    };
  }
}
