import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';

const moduleMocker = new ModuleMocker(global);

describe('TermsController', () => {
  let controller: TermsController;
  let termsService: TermsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TermsController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === TermsService) {
          return {
            // ここに Mock したいメソッドを記述する
          } as TermsService;
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = module.get<TermsController>(TermsController);
    termsService = module.get<TermsService>(TermsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(termsService).toBeDefined();
  });
});
