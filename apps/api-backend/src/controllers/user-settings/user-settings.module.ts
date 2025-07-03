import { AuthModule } from '@/auth/auth.module';
import { RssFileService } from '@/domains/user-settings/rss-file.service';
import { UserSettingsService } from '@/domains/user-settings/user-settings.service';
import { AppUsersRepository } from '@/infrastructure/database/app-users/app-users.repository';
import { PersonalizedProgramsRepository } from '@/infrastructure/database/personalized-programs/personalized-programs.repository';
import { UserSettingsRepository } from '@/infrastructure/database/user-settings/user-settings.repository';
import { S3RssFileUploader } from '@/infrastructure/external-api/aws/s3/rss-file-uploader';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { UserSettingsController } from './user-settings.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserSettingsController],
  providers: [
    UserSettingsService,
    RssFileService,
    {
      provide: 'UserSettingsRepository',
      useClass: UserSettingsRepository,
    },
    {
      provide: 'AppUserRepository',
      useClass: AppUsersRepository,
    },
    {
      provide: 'PersonalizedProgramsRepository',
      useClass: PersonalizedProgramsRepository,
    },
    {
      provide: 'RssFileUploader',
      useClass: S3RssFileUploader,
    },
  ],
})
export class UserSettingsModule {}
