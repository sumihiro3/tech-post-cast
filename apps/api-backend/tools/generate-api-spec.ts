import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { ProgramContentApiModule } from '../src/controllers/program-content-api/program-content-api.module';
import { QiitaPostDto } from '../src/controllers/qiita-posts/dto/search-qiita-posts.response.dto';
import { QiitaPostsModule } from '../src/controllers/qiita-posts/qiita-posts.module';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as req from '../src/custom';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const builder = new DocumentBuilder()
    .setTitle('TechPostCast API')
    .setDescription('TechPostCast API for frontend application')
    .setVersion('1.0')
    .build();

  const options = {
    include: [ProgramContentApiModule, QiitaPostsModule],
    extraModels: [QiitaPostDto],
    deepScanRoutes: true,
  };

  // APIモジュールごとに仕様書を生成
  const programContentApiDocument = SwaggerModule.createDocument(
    app,
    builder,
    options,
  );

  // api-specディレクトリがなければ作成
  if (!fs.existsSync('api-spec')) {
    fs.mkdirSync('api-spec', { recursive: true });
  }

  // APIモジュールごとの仕様書を保存
  fs.writeFileSync(
    'api-spec/for-frontend-api.api-spec.json',
    JSON.stringify(programContentApiDocument, undefined, 2),
  );

  // すべてのAPIを含む仕様書も生成
  const fullApiDocument = SwaggerModule.createDocument(app, builder, {
    ...options,
    include: undefined, // すべてのモジュールを含める
  });
  fs.writeFileSync(
    'api-spec/api-backend-spec.json',
    JSON.stringify(fullApiDocument, undefined, 2),
  );
}

bootstrap();
