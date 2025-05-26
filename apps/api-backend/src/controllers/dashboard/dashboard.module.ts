import { DashboardService } from '@/domains/dashboard/dashboard.service';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { PersonalizedProgramsRepository } from '@/infrastructure/database/personalized-programs/personalized-programs.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  imports: [PrismaModule],
  providers: [
    DashboardService,
    PersonalizedFeedsRepository,
    {
      provide: 'PersonalizedProgramsRepository',
      useClass: PersonalizedProgramsRepository,
    },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
