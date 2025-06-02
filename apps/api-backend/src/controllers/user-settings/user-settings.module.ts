import { AuthModule } from '@/auth/auth.module';
import { UserSettingsService } from '@/domains/user-settings/user-settings.service';
import { AppUsersRepository } from '@/infrastructure/database/app-users/app-users.repository';
import { UserSettingsRepository } from '@/infrastructure/database/user-settings/user-settings.repository';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@tech-post-cast/database';
import { UserSettingsController } from './user-settings.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserSettingsController],
  providers: [
    UserSettingsService,
    {
      provide: 'UserSettingsRepository',
      useClass: UserSettingsRepository,
    },
    {
      provide: 'AppUserRepository',
      useClass: AppUsersRepository,
    },
  ],
})
export class UserSettingsModule {}
