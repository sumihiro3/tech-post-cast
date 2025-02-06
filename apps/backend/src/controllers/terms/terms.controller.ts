import {
  Body,
  Controller,
  InternalServerErrorException,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import { BackendBearerTokenGuard } from '../../guards/bearer-token.guard';
import { CreateTermRequestDto, TermDto } from './dto';
import { TermsService } from './terms.service';

@Controller('terms')
export class TermsController {
  private readonly logger = new Logger(TermsController.name);

  constructor(private readonly termsService: TermsService) {}

  /**
   * 用語と読み方のペアを新規登録する
   */
  @Post()
  @ApiOperation({
    operationId: 'TermsController.createTerm',
    summary: '用語と読み方のペアを新規登録する',
  })
  @ApiHeader({
    name: 'Authorization',
    description: '認証トークン',
    example: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: true,
  })
  @UseGuards(BackendBearerTokenGuard)
  async createTerm(@Body() dto: CreateTermRequestDto): Promise<TermDto> {
    this.logger.debug(`TermsController.createTerm called`, { dto });
    try {
      // 用語と読み方のペアを新規登録する
      this.logger.log(`用語と読み方のペアの新規登録を開始します`, { dto });
      const term = await this.termsService.createTerm(dto);
      this.logger.log(`用語と読み方のペアの新規登録が完了しました！`, { term });
      return term;
    } catch (error) {
      const errorMessage = '用語と読み方のペアの新規登録に失敗しました';
      this.logger.error(errorMessage, error.message, error.stack);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
