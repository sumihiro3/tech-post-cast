import {
  HeadlineTopicProgramFindError,
  HeadlineTopicProgramGenerateError,
  HeadlineTopicProgramVectorizeError,
} from '@/types/errors';
import {
  HeadlineTopicProgramGenerateResult,
  HeadlineTopicProgramWithSimilarAndNeighbors,
  ProgramUploadResult,
  VectorizeResult,
} from '@domains/radio-program/headline-topic-program';
import { IHeadlineTopicProgramsRepository } from '@domains/radio-program/headline-topic-program/headline-topic-programs.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import {
  HeadlineTopicProgram,
  HeadlineTopicProgramScriptVector,
  Prisma,
  QiitaPost,
} from '@prisma/client';
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
    try {
      const result = await this.prisma.headlineTopicProgram.findUnique({
        where: { id },
        include: {
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
              headlineTopicProgramId: true,
              tags: true,
              // body フィールドのみ除外して egress を削減
            },
            orderBy: { likesCount: 'desc' },
          },
        },
      });
      this.logger.debug(
        `指定のヘッドライントピック番組 [${id}] を取得しました`,
        {
          result,
        },
      );
      return result;
    } catch (error) {
      const errorMessage = `指定のヘッドライントピック番組 [${id}] の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ヘッドライントピック番組の件数を取得する
   * @returns ヘッドライントピック番組の件数
   */
  async count(): Promise<number> {
    this.logger.debug(`HeadlineTopicProgramsRepository.count called`);
    try {
      const result = await this.prisma.headlineTopicProgram.count();
      this.logger.debug(`ヘッドライントピック番組の件数を取得しました`, {
        result,
      });
      return result;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の件数の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, {
        cause: error,
      });
    }
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
    try {
      // limit <= 0 の場合は全件を取得する
      if (limit <= 0) {
        limit = await this.count();
      }
      const result = await this.prisma.headlineTopicProgram.findMany({
        take: limit,
        skip: (page - 1) * limit,
        include: {
          posts: {
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
              headlineTopicProgramId: true,
              tags: true,
              // body フィールドのみ除外して egress を削減
            },
            orderBy: { likesCount: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      this.logger.debug(`ヘッドライントピック番組を取得しました`, { result });
      return result;
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        page,
        limit,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * ヘッドライントピック番組のID一覧を取得する
   * @returns ヘッドライントピック番組のID一覧
   */
  async findIds(): Promise<string[]> {
    this.logger.debug(`HeadlineTopicProgramsRepository.findIds called`);
    try {
      const result = await this.prisma.headlineTopicProgram.findMany({
        select: { id: true },
      });
      this.logger.debug(`ヘッドライントピック番組のID一覧を取得しました`, {
        result,
      });
      return result.map((r) => r.id);
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組のID一覧の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, {
        cause: error,
      });
    }
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
    try {
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
              select: {
                id: true,
                title: true,
                url: true,
                likesCount: true,
                stocksCount: true,
                createdAt: true,
                updatedAt: true,
                authorId: true,
                authorName: true,
                private: true,
                refreshedAt: true,
                summary: true,
                headlineTopicProgramId: true,
                tags: true,
                // body フィールドのみ除外して egress を削減
              },
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
              select: {
                id: true,
                title: true,
                url: true,
                likesCount: true,
                stocksCount: true,
                createdAt: true,
                updatedAt: true,
                authorId: true,
                authorName: true,
                private: true,
                refreshedAt: true,
                summary: true,
                headlineTopicProgramId: true,
                tags: true,
                // body フィールドのみ除外して egress を削減
              },
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
          next: {
            id: next?.id,
            title: next?.title,
            createdAt: next?.createdAt,
          },
        },
      );
      return { similar, previous, target, next };
    } catch (error) {
      const errorMessage = `指定の番組と、その類似番組および、前後の日付の番組の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, {
        cause: error,
      });
    }
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
    try {
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
    } catch (error) {
      const errorMessage = `ヘッドライントピック番組の新規登録に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        programDate,
        posts,
        programGenerateResult,
        programUploadResult,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramGenerateError(errorMessage, {
        cause: error,
      });
    }
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
    return {
      title: programGenerateResult.script.title,
      script: programGenerateResult.script as unknown as Prisma.InputJsonValue,
      chapters: programGenerateResult.chapters as unknown as Prisma.JsonArray,
      audioUrl: programUploadResult.audioUrl,
      audioDuration: programGenerateResult.audioDuration,
      videoUrl: '',
      posts: {
        connect: posts.map((post) => ({ id: post.id })),
      },
      createdAt: programDate,
      updatedAt: new Date(),
    };
  }

  /**
   * ヘッドライントピック番組を更新する
   * @param id 番組 ID
   * @param programGenerateResult 番組ファイルの生成結果
   * @param programUploadResult 番組ファイルのアップロード結果
   * @returns 更新したヘッドライントピック番組
   */
  updateHeadlineTopicProgram(
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
    return this.prisma.headlineTopicProgram.update({
      where: { id },
      data: {
        script:
          programGenerateResult.script as unknown as Prisma.InputJsonValue,
        chapters: programGenerateResult.chapters as unknown as Prisma.JsonArray,
        audioUrl: programUploadResult.audioUrl,
        audioDuration: programGenerateResult.audioDuration,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * ヘッドライントピック番組の台本のベクトルデータを設定する
   * @param id 番組 ID
   * @param vectorizeResult ベクトル化結果
   * @returns 設定したヘッドライントピック番組の台本ベクトルデータ
   */
  async setHeadlineTopicProgramScriptVector(
    id: string,
    vectorizeResult: VectorizeResult,
  ): Promise<HeadlineTopicProgramScriptVector> {
    this.logger.debug(
      `HeadlineTopicProgramsRepository.setHeadlineTopicProgramScriptVector called`,
      { id, model: vectorizeResult.model, tokens: vectorizeResult.totalTokens },
    );
    try {
      // Transaction で更新する
      const result = await this.prisma.$transaction(async (prisma) => {
        // HeadlineTopicProgramScriptVector に指定の番組IDのデータが有れば削除する
        const record = await prisma.headlineTopicProgramScriptVector.findUnique(
          {
            where: { id },
          },
        );
        if (record) {
          await prisma.headlineTopicProgramScriptVector.delete({
            where: { id },
          });
        }
        // ベクトルデータを文字列化する
        const vectorData = JSON.stringify(vectorizeResult.vector);
        // HeadlineTopicProgramScriptVector に新しいベクトルデータを登録する
        await prisma.$executeRaw`INSERT INTO headline_topic_program_vectors (id, vector, model, total_tokens) VALUES (${id}, ${vectorData}::vector, ${vectorizeResult.model}, ${vectorizeResult.totalTokens});`;
        // ベクトル化結果を取得する
        return prisma.headlineTopicProgramScriptVector.findUnique({
          where: { id },
        });
      });
      this.logger.log(`番組台本のベクトルデータを更新しました`, {
        id: result.id,
        model: result.model,
        totalTokens: result.totalTokens,
      });
      return result;
    } catch (error) {
      const errorMessage = `番組台本のベクトルデータの更新に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
        vectorizeResult,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramVectorizeError(errorMessage, {
        cause: error,
      });
    }
  }

  /**
   * 指定のヘッドライントピックと似た番組を取得する
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
    try {
      // 類似番組を台本のベクトルデータを使って検索する
      const findSimilarResult = await this.prisma.$queryRaw<
        FindSimilarProgramsResult[]
      >`SELECT id, vector::text, 1 - (vector <-> (SELECT vector FROM headline_topic_program_vectors WHERE id = ${id})) AS similarity FROM headline_topic_program_vectors ORDER BY vector <-> (SELECT vector FROM headline_topic_program_vectors WHERE id = ${id}) LIMIT 4`;
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
            select: {
              id: true,
              title: true,
              url: true,
              likesCount: true,
              stocksCount: true,
              createdAt: true,
              updatedAt: true,
              authorId: true,
              authorName: true,
              private: true,
              refreshedAt: true,
              summary: true,
              headlineTopicProgramId: true,
              tags: true,
              // body フィールドのみ除外して egress を削減
            },
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
    } catch (error) {
      const errorMessage = `指定の番組と似た番組の取得に失敗しました`;
      this.logger.error(errorMessage, {
        error,
        id,
      });
      this.logger.error(error.message, error.stack);
      throw new HeadlineTopicProgramFindError(errorMessage, {
        cause: error,
      });
    }
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
