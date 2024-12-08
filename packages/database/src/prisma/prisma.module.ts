import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [{
    useFactory: (config: ConfigService) => {
      return new PrismaService(config)
    },
    provide: PrismaService,
    inject: [ConfigService]
  }],
  exports: [PrismaService],
})
export class PrismaModule {}
