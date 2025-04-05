import {
  IQiitaPostApiResponse,
  QiitaPostApiResponse,
} from '@domains/qiita-posts/qiita-posts.entity';
import { IQiitaPostsRepository } from '@domains/qiita-posts/qiita-posts.repository.interface';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, QiitaPost } from '@prisma/client';
import { PrismaService } from '@tech-post-cast/database';

/**
 * IQiitaItemsRepository の実装
 * Prisma を利用してデータベースにアクセスする
 */
@Injectable()
export class QiitaPostsRepository implements IQiitaPostsRepository {
  private readonly logger = new Logger(QiitaPostsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 指定 ID の Qiita 記事を取得する
   * @param id Qiita 記事 ID
   * @returns Qiita 記事
   */
  async findOne(id: string): Promise<QiitaPost | null> {
    this.logger.verbose({ id }, `QiitaItemsRepository.findOne called`);
    const result = await this.prisma.qiitaPost.findUnique({
      where: { id },
    });
    this.logger.debug(`指定の記事 [${id}] を取得しました`, { result });
    return result;
  }

  /**
   * 指定の Qiita 記事一覧のうち、存在しない記事一覧を取得する
   * @param posts Qiita 記事 一覧
   * @returns 存在しない Qiita 記事一覧
   */
  async findNotExistsPosts(
    posts: QiitaPostApiResponse[],
  ): Promise<QiitaPostApiResponse[]> {
    this.logger.verbose(`QiitaItemsRepository.findNotExistsPosts called`, {
      posts,
    });
    // 記事 ID 一覧を取得する
    const postIds = posts.map((item) => item.id);
    // データベースに登録されている記事 ID 一覧を取得する
    const existingIds = await this.prisma.qiitaPost.findMany({
      where: {
        id: {
          in: postIds,
        },
      },
      select: {
        id: true,
      },
    });
    // 存在しない記事一覧に絞り込む
    const result = posts.filter(
      (item) => !existingIds.some((existing) => existing.id === item.id),
    );
    this.logger.debug(`存在しない記事一覧を取得しました`, { result });
    return result;
  }

  /**
   * Qiita 記事を新規登録または更新する
   * @param post 登録する Qiita 記事
   * @returns 登録した Qiita 記事
   */
  async upsertQiitaPost(post: QiitaPostApiResponse): Promise<QiitaPost> {
    this.logger.verbose(`QiitaItemsRepository.upsertQiitaItems called`, {
      post,
    });
    // 記事を新規登録または更新する
    const result: QiitaPost = await this.prisma.qiitaPost.upsert(
      this.createUpsertQiitaPostQuery(post),
    );
    this.logger.debug(`指定の記事を新規登録または更新しました`, { result });
    return result;
  }

  /**
   * 複数の Qiita 記事を新規登録または更新する
   * @param posts 登録する Qiita 記事一覧
   * @returns 登録した Qiita 記事一覧
   */
  async upsertQiitaPosts(posts: QiitaPostApiResponse[]): Promise<QiitaPost[]> {
    this.logger.verbose(`QiitaItemsRepository.upsertQiitaItems called`, {
      posts,
    });
    // 記事を新規登録または更新する
    const queries = posts.map((item) => {
      // 記事を新規登録または更新のクエリを生成する
      return this.prisma.qiitaPost.upsert(
        this.createUpsertQiitaPostQuery(item),
      );
    });
    const result = await this.prisma.$transaction([...queries]);
    this.logger.debug(`指定の記事を新規登録または更新しました`, { result });
    return result;
  }

  /**
   * 指定 ID リストの Qiita 記事を本文も含めて取得する
   * @param ids Qiita 記事 ID リスト
   * @returns 本文を含むQiita記事リスト
   */
  async findWithBodyByIds(ids: string[]): Promise<QiitaPost[]> {
    this.logger.verbose(`QiitaPostsRepository.findWithBodyByIds called`, {
      ids,
    });
    const result = await this.prisma.qiitaPost.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    this.logger.debug(`指定IDの記事リスト（本文含む）を取得しました`, {
      count: result.length,
      ids: result.map((p) => p.id),
    });
    return result;
  }

  /**
   * Qiita 記事の新規登録または更新クエリを生成する
   * @param post Qiita 記事 API レスポンス
   * @returns Qiita 記事の新規登録または更新クエリ
   */
  private createUpsertQiitaPostQuery(
    post: IQiitaPostApiResponse,
  ): Prisma.QiitaPostUpsertArgs {
    this.logger.verbose(
      `QiitaItemsRepository.createUpsertQiitaPostQuery called`,
      { post },
    );
    const authorName = post.user.name ? post.user.name : post.user.id;
    const update = {
      title: post.title,
      body: post.body,
      url: post.url,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      authorId: post.user.id,
      authorName,
      likesCount: post.likes_count,
      stocksCount: post.stocks_count,
      private: post.private,
      summary: post.summary,
    };
    const create = { ...update, id: post.id };
    return {
      where: { id: post.id },
      update,
      create,
    };
  }
}
