import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClientManager, PrismaService } from './';

@Module({
  providers: [{
    useFactory: (config: ConfigService) => {
      return new PrismaService(config)
    },
    provide: PrismaService,
    inject: [ConfigService],
  }, PrismaClientManager],
  exports: [PrismaService, PrismaClientManager],
})
export class PrismaModule {}
