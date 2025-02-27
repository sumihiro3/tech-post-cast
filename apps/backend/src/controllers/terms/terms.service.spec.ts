import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { TermsService } from './terms.service';
const moduleMocker = new ModuleMocker(global);

describe('TermsService', () => {
  let service: TermsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TermsService],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === TermsRepository) {
          return {
            // ここに Mock したいメソッドを記述する
          } as TermsRepository;
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

    service = module.get<TermsService>(TermsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
