import { LineBotSignatureGuard } from '@/guards/line-bot/ine-bot-signature.guard';
import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { LineBotController } from './line-bot.controller';
import { LineBotService } from './line-bot.service';

const moduleMocker = new ModuleMocker(global);

describe('LineBotController', () => {
  let controller: LineBotController;
  let lineBotService: LineBotService;

  const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineBotController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === LineBotService) {
          return {
            // ここに Mock したいメソッドを記述する
          } as LineBotService;
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      // Guard は Mock を使うように設定
      // @see https://github.com/nestjs/nest/issues/4717
      .overrideGuard(LineBotSignatureGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<LineBotController>(LineBotController);
    lineBotService = module.get<LineBotService>(LineBotService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(lineBotService).toBeDefined();
  });
});
