import { PersonalizedProgramAttemptsService } from '@/domains/personalized-program-attempts/personalized-program-attempts.service';
import { PersonalizedFeedsRepository } from '@/infrastructure/database/personalized-feeds/personalized-feeds.repository';
import { PersonalizedProgramAttemptsRepository } from '@/infrastructure/database/personalized-program-attempts/personalized-program-attempts.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { PersonalizedProgramAttemptsController } from './personalized-program-attempts.controller';

@Module({
  controllers: [PersonalizedProgramAttemptsController],
  imports: [PrismaModule],
  providers: [
    PersonalizedProgramAttemptsService,
    {
      provide: 'PersonalizedProgramAttemptsRepository',
      useClass: PersonalizedProgramAttemptsRepository,
    },
    {
      provide: 'PersonalizedFeedsRepository',
      useClass: PersonalizedFeedsRepository,
    },
  ],
  exports: [PersonalizedProgramAttemptsService],
})
export class PersonalizedProgramAttemptsModule {}
