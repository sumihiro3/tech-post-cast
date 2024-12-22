import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { ApiV1Module } from '../src/controllers/api-v1/api-v1.module';

NestFactory.create(AppModule).then((app) => {
  const builder = new DocumentBuilder()
    .setTitle('TechPostCast APIs')
    .setDescription('API document for TechPostCast APIs')
    .setVersion('1.0')
    .build();
  // フロント向けのAPI仕様書を生成
  const frontendApiDocument = SwaggerModule.createDocument(app, builder, {
    include: [ApiV1Module],
  });
  fs.writeFileSync(
    'api-spec/frontend.api-spec.json',
    JSON.stringify(frontendApiDocument, undefined, 2),
  );
});
