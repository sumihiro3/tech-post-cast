import {
  HeadlineTopicProgramGenerateResult,
  ProgramUploadResult,
} from '@domains/radio-program/headline-topic-program';
import { IHeadlineTopicProgramsRepository } from '@domains/radio-program/headline-topic-program/headline-topic-programs.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { HeadlineTopicProgram, Prisma, QiitaPost } from '@prisma/client';
import {
  HeadlineTopicProgramWithQiitaPosts,
  PrismaService,
} from '@tech-post-cast/database';

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
  async findOne(id: string): Promise<HeadlineTopicProgramWithQiitaPosts> {
    this.logger.debug(`HeadlineTopicProgramsRepository.findOne called`, { id });
    const result = await this.prisma.headlineTopicProgram.findUnique({
      where: { id },
      include: { posts: true },
    });
    this.logger.debug(`指定のヘッドライントピック番組 [${id}] を取得しました`, {
      result,
    });
    return result;
  }

  /**
   * ヘッドライントピック番組の件数を取得する
   * @returns ヘッドライントピック番組の件数
   */
  async count(): Promise<number> {
    this.logger.debug(`HeadlineTopicProgramsRepository.count called`);
    const result = await this.prisma.headlineTopicProgram.count();
    this.logger.debug(`ヘッドライントピック番組の件数を取得しました`, {
      result,
    });
    return result;
  }

  /**
   * ヘッドライントピック番組を取得する
   * @param page ページ番号
   * @param limit 1 ページあたりの件数
   * @returns ヘッドライントピック番組一覧
   */
  async find(page: number, limit: number): Promise<HeadlineTopicProgram[]> {
    this.logger.debug(`HeadlineTopicProgramsRepository.find called`, {
      page,
      limit,
    });
    const result = await this.prisma.headlineTopicProgram.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    });
    this.logger.debug(`ヘッドライントピック番組を取得しました`, { result });
    return result;
  }

  /**
   * ヘッドライントピック番組を新規登録する
   * @param programDate 番組日時
   * @param posts 番組での紹介記事 一覧
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   */
  async createHeadlineTopicProgram(
    programDate: Date,
    posts: QiitaPost[],
    programGenerateResult: HeadlineTopicProgramGenerateResult,
    programUploadResult: ProgramUploadResult,
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.createHeadlineTopicProgram called`,
      {
        programGenerateResult,
        programUploadResult,
      },
    );
    const result: HeadlineTopicProgram =
      await this.prisma.headlineTopicProgram.create({
        data: this.createInsertQuery(
          programDate,
          posts,
          programGenerateResult,
          programUploadResult,
        ),
      });
    this.logger.debug(`ヘッドライントピック番組を新規登録しました`, {
      result,
    });
    return result;
  }

  /**
   * ヘッドライントピック番組の新規登録または更新クエリを生成する
   * @param programDate 番組日時
   * @param posts 紹介記事一覧
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   * @returns ヘッドライントピック番組の新規登録または更新クエリ
   */
  private createInsertQuery(
    programDate: Date,
    posts: QiitaPost[],
    programGenerateResult: HeadlineTopicProgramGenerateResult,
    programUploadResult: ProgramUploadResult,
  ): Prisma.HeadlineTopicProgramCreateInput {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.createInsertQuery called`,
      {
        programGenerateResult,
        programUploadResult,
      },
    );
    const scriptString = JSON.stringify(programGenerateResult.script);
    return {
      title: programGenerateResult.script.title,
      script: scriptString as Prisma.InputJsonValue,
      audioUrl: programUploadResult.audioUrl,
      audioDuration: programGenerateResult.audioDuration,
      videoUrl: programUploadResult.videoUrl,
      posts: {
        connect: posts.map((post) => ({ id: post.id })),
      },
      createdAt: programDate,
      updatedAt: new Date(),
    };
  }
}
