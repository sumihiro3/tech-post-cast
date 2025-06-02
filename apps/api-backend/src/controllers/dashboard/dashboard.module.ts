import { DashboardService } from '@/domains/dashboard/dashboard.service';
import { AppUsersRepository } from '@/infrastructure/database/app-users/app-users.repository';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { PersonalizedProgramAttemptsRepository } from '@/infrastructure/database/personalized-program-attempts/personalized-program-attempts.repository';
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
    {
      provide: 'AppUsersRepository',
      useClass: AppUsersRepository,
    },
    {
      provide: 'PersonalizedProgramAttemptsRepository',
      useClass: PersonalizedProgramAttemptsRepository,
    },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
