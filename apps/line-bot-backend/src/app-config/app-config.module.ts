import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Global()
@Module({
  // imports: [ConfigModule.forRoot({ envFilePath: ['.env'] })],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
