import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkJwtGuard } from './guards/clerk-jwt.guard';

@Module({
  imports: [ConfigModule],
  providers: [ClerkJwtGuard],
  exports: [ClerkJwtGuard],
})
export class AuthModule {}
