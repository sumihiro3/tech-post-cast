import { Injectable, Logger } from '@nestjs/common';
import { isFullWidthCharacter } from '@tech-post-cast/commons';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor() {}

  getHello(): string {
    this.logger.debug(`isFullWidthCharacter: ${isFullWidthCharacter(0x0)}`);
    return 'Hello World!';
  }
}
