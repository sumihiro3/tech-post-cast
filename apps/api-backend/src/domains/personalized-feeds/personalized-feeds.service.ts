import { IAppUserRepository } from '@/domains/app-user/app-user.repository.interface';
import { UserNotFoundError } from '@/types/errors';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppUser } from '@prisma/client';
import {
  PersonalizedFeed,
  PersonalizedFeedsResult,
} from './personalized-feeds.entity';
import { IPersonalizedFeedsRepository } from './personalized-feeds.repository.interface';

@Injectable()
export class PersonalizedFeedsService {
  private readonly logger = new Logger(PersonalizedFeedsService.name);

  constructor(
    @Inject('IPersonalizedFeedsRepository')
    private readonly personalizedFeedsRepository: IPersonalizedFeedsRepository,
    @Inject('IAppUserRepository')
    private readonly appUserRepository: IAppUserRepository,
  ) {}

  /**
   * 指定されたユーザーIDに紐づくパーソナライズフィードの一覧を取得する
   * @param userId ユーザーID
   * @param page ページ番号（1から始まる）
   * @param perPage 1ページあたりの件数
   * @returns パーソナライズフィード一覧と総件数
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PersonalizedFeedsResult> {
    this.logger.debug('PersonalizedFeedsService.findByUserId', {
      userId,
      page,
      perPage,
    });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);
    // ユーザーのパーソナライズフィード一覧を取得する
    return this.personalizedFeedsRepository.findByUserId(
      user.id,
      page,
      perPage,
    );
  }

  /**
   * 指定されたIDのパーソナライズフィードを取得する
   * ただし、指定されたユーザーIDに紐づくフィードのみ取得可能
   * @param id パーソナライズフィードID
   * @param userId ユーザーID
   * @returns パーソナライズフィード
   * @throws NotFoundException フィードが存在しない場合
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async findById(id: string, userId: string): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsService.findById', { id, userId });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);
    const feed = await this.personalizedFeedsRepository.findById(id);

    // フィードが存在しない場合はエラー
    if (!feed) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }
    // 認証済みユーザーのフィードのみアクセス可能
    if (feed.userId !== user.id) {
      throw new NotFoundException(
        `パーソナライズフィード [${id}] は存在しません`,
      );
    }
    return feed;
  }

  /**
   * ユーザーのパーソナライズフィードを新規作成する
   * @param userId ユーザーID
   * @param name フィード名
   * @param dataSource データソース
   * @param filterConfig フィルター設定
   * @param deliveryConfig 配信設定
   * @param isActive 有効状態
   * @returns 作成されたパーソナライズフィード
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async create(
    userId: string,
    name: string,
    dataSource: string,
    filterConfig: Record<string, any>,
    deliveryConfig: Record<string, any>,
    isActive: boolean = true,
  ): Promise<PersonalizedFeed> {
    this.logger.debug('PersonalizedFeedsService.create', {
      userId,
      name,
      dataSource,
      filterConfig,
      deliveryConfig,
      isActive,
    });

    // ユーザーの存在確認
    const user = await this.validateUserExists(userId);

    // パーソナライズフィードを作成
    const feed = await this.personalizedFeedsRepository.create({
      name,
      userId: user.id,
      dataSource,
      filterConfig,
      deliveryConfig,
      isActive,
    });

    this.logger.log(
      `ユーザー [${userId}] のパーソナライズフィード [${feed.id}] を新規作成しました`,
      {
        feedId: feed.id,
        userId,
        name,
      },
    );

    return feed;
  }

  /**
   * ユーザーが存在するか確認する
   * @param userId ユーザーID
   * @throws UserNotFoundError ユーザーが存在しない場合
   */
  async validateUserExists(userId: string): Promise<AppUser> {
    try {
      const user = await this.appUserRepository.findOne(userId);
      if (!user) {
        // ユーザーが存在しない場合はエラー
        throw new UserNotFoundError(userId);
      }
      // ユーザーが無効化されている場合もエラー
      if (!user.isActive) {
        throw new UserNotFoundError(
          userId,
          new Error('ユーザーは無効化されています'),
        );
      }
      return user;
    } catch (error) {
      // AppUserRepository からのエラーをラップして再スロー
      if (!(error instanceof UserNotFoundError)) {
        this.logger.error(
          `ユーザー [${userId}] の存在確認に失敗しました`,
          error,
        );
        throw new UserNotFoundError(userId, error);
      }
      throw error;
    }
  }
}
