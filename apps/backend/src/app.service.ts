import { Injectable } from '@nestjs/common';
import { isFullWidthCharacter } from '@tech-post-cast/commons';

@Injectable()
export class AppService {
  getHello(): string {
    isFullWidthCharacter(0x0);
    return 'Hello World!';
  }
}
