import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { ApiV1Controller } from './api-v1.controller';
import { ApiV1Service } from './api-v1.service';

const moduleMocker = new ModuleMocker(global);

describe('ApiV1Controller', () => {
  let controller: ApiV1Controller;
  let service: ApiV1Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiV1Controller],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === ApiV1Service) {
          return {
            // ここに Mock したいメソッドを記述する
          } as ApiV1Service;
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

    controller = module.get<ApiV1Controller>(ApiV1Controller);
    service = module.get<ApiV1Service>(ApiV1Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
