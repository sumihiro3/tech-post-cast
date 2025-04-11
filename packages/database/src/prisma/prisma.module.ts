import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClientManager } from './prisma-client-manager';
import { PrismaService } from './prisma.service';

@Module({
  providers: [{
    useFactory: (config: ConfigService) => {
      return new PrismaService(config)
    },
    provide: PrismaService,
    inject: [ConfigService],
  },
  {
    provide: PrismaClientManager,
    useFactory: (config: ConfigService) => {
      return new PrismaClientManager(config);
    },
    inject: [ConfigService],
  },
],
  exports: [PrismaService, PrismaClientManager],
})
export class PrismaModule {}
