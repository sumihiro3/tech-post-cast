import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomLoggerService } from '@tech-post-cast/commons';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // @see https://docs.nestjs.com/techniques/logger#dependency-injection
    // NOTE
    // In the example above, we set the bufferLogs to true to make sure all logs will be buffered until a custom logger is attached (MyLogger in this case) and the application initialisation process either completes or fails. If the initialisation process fails, Nest will fallback to the original ConsoleLogger to print out any reported error messages. Also, you can set the autoFlushLogs to false (default true) to manually flush logs (using the Logger#flush() method).
    bufferLogs: true,
  });
  app.useLogger(app.get(CustomLoggerService));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
