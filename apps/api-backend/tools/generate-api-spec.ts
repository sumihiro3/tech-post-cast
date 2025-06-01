import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import {
  GetDashboardPersonalizedProgramsRequestDto,
  GetDashboardPersonalizedProgramsResponseDto,
  GetDashboardStatsResponseDto,
  GetDashboardSubscriptionResponseDto,
} from '../src/controllers/dashboard/dto';
import { QiitaPostDto } from '../src/controllers/qiita-posts/dto/search-qiita-posts.response.dto';

// 型定義はsrc/custom.d.tsで定義済み（tsconfig.jsonのfilesで明示的に読み込み）

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const builder = new DocumentBuilder()
    .setTitle('TechPostCast API')
    .setDescription('TechPostCast API for frontend application')
    .setVersion('1.0')
    .build();

  const options = {
    // include: [DashboardModule],
    extraModels: [
      QiitaPostDto,
      GetDashboardStatsResponseDto,
      GetDashboardSubscriptionResponseDto,
      GetDashboardPersonalizedProgramsRequestDto,
      GetDashboardPersonalizedProgramsResponseDto,
    ],
    deepScanRoutes: true,
  };

  // api-specディレクトリがなければ作成
  if (!fs.existsSync('api-spec')) {
    fs.mkdirSync('api-spec', { recursive: true });
  }

  // すべてのAPIを含む仕様書も生成
  const fullApiDocument = SwaggerModule.createDocument(app, builder, {
    ...options,
    include: undefined, // すべてのモジュールを含める
    ignoreGlobalPrefix: false,
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  fs.writeFileSync(
    'api-spec/api-backend-spec.json',
    JSON.stringify(fullApiDocument, undefined, 2),
  );
}

bootstrap();
