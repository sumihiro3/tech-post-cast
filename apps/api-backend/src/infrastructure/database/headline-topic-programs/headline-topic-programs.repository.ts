import {
  HeadlineTopicProgramGenerateResult,
  HeadlineTopicProgramWithSimilarAndNeighbors,
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
      include: {
        posts: {
          orderBy: { likesCount: 'desc' },
        },
      },
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
  async find(
    page: number,
    limit: number,
  ): Promise<HeadlineTopicProgramWithQiitaPosts[]> {
    this.logger.debug(`HeadlineTopicProgramsRepository.find called`, {
      page,
      limit,
    });
    // limit <= 0 の場合は全件を取得する
    if (limit <= 0) {
      limit = await this.count();
    }
    const result = await this.prisma.headlineTopicProgram.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        posts: {
          orderBy: { likesCount: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    this.logger.debug(`ヘッドライントピック番組を取得しました`, { result });
    return result;
  }

  /**
   * ヘッドライントピック番組のID一覧を取得する
   * @returns ヘッドライントピック番組のID一覧
   */
  async findIds(): Promise<string[]> {
    this.logger.debug(`HeadlineTopicProgramsRepository.findIds called`);
    const result = await this.prisma.headlineTopicProgram.findMany({
      select: { id: true },
    });
    this.logger.debug(`ヘッドライントピック番組のID一覧を取得しました`, {
      result,
    });
    return result.map((r) => r.id);
  }

  /**
   * 指定のヘッドライントピック番組と、その類似番組および、前後の日付の番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns ヘッドライントピック番組と、その類似番組および、前後の日付の番組
   */
  async findWithSimilarAndNeighbors(
    id: string,
  ): Promise<HeadlineTopicProgramWithSimilarAndNeighbors> {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.findWithSimilarAndNeighbors called`,
      { id },
    );
    // 基準となる番組を取得
    const target = await this.findOne(id);
    // 前日と翌日の番組を取得
    const [similar, previous, next] = await Promise.all([
      // 類似番組を取得
      this.findSimilarPrograms(id),
      // 前日の番組を取得
      this.prisma.headlineTopicProgram.findFirst({
        where: {
          createdAt: { lt: target.createdAt },
        },
        orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
          },
        },
      }),
      // 翌日の番組を取得
      this.prisma.headlineTopicProgram.findFirst({
        where: {
          createdAt: { gt: target.createdAt },
        },
        orderBy: [{ createdAt: 'asc' }, { updatedAt: 'desc' }],
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
          },
        },
      }),
    ]);
    this.logger.debug(
      `指定の番組と、その類似番組および、前日と翌日の番組を取得しました`,
      {
        similar: similar.map((p) => {
          return { id: p.id, title: p.title };
        }),
        previous: {
          id: previous?.id,
          title: previous?.title,
          createdAt: previous?.createdAt,
        },
        target: {
          id: target.id,
          title: target.title,
          createdAt: target.createdAt,
        },
        next: { id: next?.id, title: next?.title, createdAt: next?.createdAt },
      },
    );
    return { similar, previous, target, next };
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
    this.logger.debug(
      `ヘッドライントピック番組を作成しました: ${result.id}`,
      result,
    );
    return result;
  }

  /**
   * 新規登録用にパースしたオブジェクトを作成する
   * @param programDate 番組日時
   * @param posts 番組での紹介記事一覧
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   */
  private createInsertQuery(
    programDate: Date,
    posts: QiitaPost[],
    programGenerateResult: HeadlineTopicProgramGenerateResult,
    programUploadResult: ProgramUploadResult,
  ): Prisma.HeadlineTopicProgramCreateInput {
    // ヘッドライントピック番組用オブジェクトを作成
    const data: Prisma.HeadlineTopicProgramCreateInput = {
      title: programGenerateResult.script.title,
      audioDuration: programGenerateResult.audioDuration,
      audioUrl: programUploadResult.audioUrl,
      videoUrl: programUploadResult.videoUrl,
      imageUrl: programUploadResult.imageUrl,
      script: JSON.stringify(programGenerateResult.script),
      chapters: JSON.stringify(programGenerateResult.chapters),
      createdAt: programDate,
      updatedAt: new Date(),
      posts: {
        connect: posts.map((post) => {
          return {
            id: post.id,
          };
        }),
      },
    };
    return data;
  }

  /**
   * ヘッドライントピック番組を更新する
   * @param id 番組 ID
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   * @returns 更新したヘッドライントピック番組
   */
  async updateHeadlineTopicProgram(
    id: string,
    programGenerateResult: HeadlineTopicProgramGenerateResult,
    programUploadResult: ProgramUploadResult,
  ): Promise<HeadlineTopicProgram> {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.updateHeadlineTopicProgram called`,
      {
        id,
        programGenerateResult,
        programUploadResult,
      },
    );
    // 更新処理
    const data: Prisma.HeadlineTopicProgramUpdateInput = {
      title: programGenerateResult.script.title,
      audioDuration: programGenerateResult.audioDuration,
      audioUrl: programUploadResult.audioUrl,
      videoUrl: programUploadResult.videoUrl,
      imageUrl: programUploadResult.imageUrl,
      script: JSON.stringify(programGenerateResult.script),
      chapters: JSON.stringify(programGenerateResult.chapters),
    };
    const result = await this.prisma.headlineTopicProgram.update({
      data,
      where: { id },
    });
    this.logger.debug(
      `ヘッドライントピック番組を更新しました: ${result.id}`,
      result,
    );
    return result;
  }

  /**
   * 指定のヘッドライントピック番組に類似した番組を取得する
   * @param id ヘッドライントピック番組 ID
   * @returns 類似番組一覧
   */
  async findSimilarPrograms(
    id: string,
  ): Promise<HeadlineTopicProgramWithQiitaPosts[]> {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.findSimilarPrograms called`,
      { id },
    );

    // 類似番組を台本のベクトルデータを使って検索する
    const findSimilarResult = await this.prisma.$queryRaw<
      FindSimilarProgramsResult[]
    >`SELECT id, vector::text, 1 - (vector <=> (SELECT vector FROM headline_topic_program_vectors WHERE id = ${id})) AS similarity FROM headline_topic_program_vectors ORDER BY vector <=> (SELECT vector FROM headline_topic_program_vectors WHERE id = ${id}) LIMIT 4`;

    // 類似番組の ID 一覧を取得する
    const ids = findSimilarResult.map((r) => r.id);
    // 指定された番組は除外する
    const similarProgramIds = ids.filter((r) => r !== id);
    this.logger.debug(`類似番組の ID 一覧を取得しました`, {
      similarProgramIds,
    });

    // 類似番組を取得する
    const similarPrograms = await this.prisma.headlineTopicProgram.findMany({
      where: { id: { in: similarProgramIds } },
      include: {
        posts: {
          orderBy: { likesCount: 'desc' },
        },
      },
    });

    // 類似度で並び替え
    similarPrograms.sort((a, b) => {
      const aSimilarity = findSimilarResult.find(
        (r) => r.id === a.id,
      )?.similarity;
      const bSimilarity = findSimilarResult.find(
        (r) => r.id === b.id,
      )?.similarity;
      return aSimilarity && bSimilarity ? bSimilarity - aSimilarity : 0;
    });

    return similarPrograms;
  }
}

/**
 * 類似番組検索結果
 */
interface FindSimilarProgramsResult {
  id: string;
  vector: string;
  similarity: number;
}
