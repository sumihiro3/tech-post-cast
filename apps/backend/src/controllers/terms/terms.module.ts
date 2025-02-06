import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';

@Module({
  imports: [PrismaModule],
  controllers: [TermsController],
  providers: [TermsService, TermsRepository],
})
export class TermsModule {}
