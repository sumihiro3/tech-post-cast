import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CustomLoggerMiddleware } from './custom-logger.middleware';
import { CustomLoggerService } from './custom-logger.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [{
    useFactory: (config: ConfigService) => {
      return new CustomLoggerService(config)
    },
    provide: CustomLoggerService,
    inject: [ConfigService]
  }],
  exports: [CustomLoggerService],
})
export class CustomLoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CustomLoggerMiddleware).forRoutes('*');
  }
}
