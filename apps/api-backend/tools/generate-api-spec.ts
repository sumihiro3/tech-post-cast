import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { ProgramContentApiModule } from '../src/controllers/program-content-api/program-content-api.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const builder = new DocumentBuilder()
    .setTitle('TechPostCast API')
    .setDescription('TechPostCast API for frontend application')
    .setVersion('1.0')
    .build();

  // APIモジュールごとに仕様書を生成
  const programContentApiDocument = SwaggerModule.createDocument(app, builder, {
    include: [ProgramContentApiModule],
  });

  // api-specディレクトリがなければ作成
  if (!fs.existsSync('api-spec')) {
    fs.mkdirSync('api-spec', { recursive: true });
  }

  // APIモジュールごとの仕様書を保存
  fs.writeFileSync(
    'api-spec/program-content-api.api-spec.json',
    JSON.stringify(programContentApiDocument, undefined, 2),
  );

  // すべてのAPIを含む仕様書も生成
  const fullApiDocument = SwaggerModule.createDocument(app, builder);
  fs.writeFileSync(
    'api-spec/full-api.api-spec.json',
    JSON.stringify(fullApiDocument, undefined, 2),
  );
}

bootstrap();
