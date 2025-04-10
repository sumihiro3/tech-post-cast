import { Auth } from '@/auth/decorators/auth.decorator';
import { CurrentUserId } from '@/auth/decorators/current-user-id.decorator';
import { PersonalizedFeedsService } from '@/domains/personalized-feeds/personalized-feeds.service';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GetPersonalizedFeedsRequestDto,
  GetPersonalizedFeedsResponseDto,
} from './dto';

@Controller('personalized-feeds')
@ApiTags('Personalized Feeds')
@Auth() // クラスレベルで認証を適用
export class PersonalizedFeedsController {
  private readonly logger = new Logger(PersonalizedFeedsController.name);

  constructor(
    private readonly personalizedFeedsService: PersonalizedFeedsService,
  ) {}

  /**
   * ユーザーのパーソナライズフィード一覧を取得するAPI
   */
  @Get()
  @ApiOperation({
    summary: 'パーソナライズフィード一覧取得',
    description: 'ユーザーが登録したパーソナライズフィードの一覧を取得します',
    operationId: 'getPersonalizedFeeds',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: GetPersonalizedFeedsResponseDto,
  })
  async getPersonalizedFeeds(
    @Query() dto: GetPersonalizedFeedsRequestDto,
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<GetPersonalizedFeedsResponseDto> {
    this.logger.verbose(`PersonalizedFeedsController.getPersonalizedFeeds`, {
      userId,
      page: dto.page,
      perPage: dto.perPage,
    });
    // ユーザーのパーソナライズフィード一覧を取得
    const result = await this.personalizedFeedsService.findByUserId(
      userId,
      dto.page,
      dto.perPage,
    );
    // DTOに変換して返却
    return GetPersonalizedFeedsResponseDto.fromEntity(result);
  }
}
