import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import {
  LegacyApiV1Controller,
  ProgramContentApiController,
} from './program-content-api.controller';
import { ProgramContentApiService } from './program-content-api.service';

const moduleMocker = new ModuleMocker(global);

describe('ProgramContentApiController', () => {
  let controller: ProgramContentApiController;
  let service: ProgramContentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramContentApiController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === ProgramContentApiService) {
          return {
            getHeadlineTopicProgram: jest.fn(),
            getHeadlineTopicPrograms: jest.fn(),
            getHeadlineTopicProgramsCounts: jest.fn(),
            getHeadlineTopicProgramIds: jest.fn(),
            getHeadlineTopicProgramWithSimilarAndNeighbors: jest.fn(),
          } as Partial<ProgramContentApiService>;
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

    controller = module.get<ProgramContentApiController>(
      ProgramContentApiController,
    );
    service = module.get<ProgramContentApiService>(ProgramContentApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});

describe('LegacyApiV1Controller', () => {
  let controller: LegacyApiV1Controller;
  let service: ProgramContentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegacyApiV1Controller],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === ProgramContentApiService) {
          return {
            getHeadlineTopicProgram: jest.fn(),
            getHeadlineTopicPrograms: jest.fn(),
            getHeadlineTopicProgramsCounts: jest.fn(),
            getHeadlineTopicProgramIds: jest.fn(),
            getHeadlineTopicProgramWithSimilarAndNeighbors: jest.fn(),
          } as Partial<ProgramContentApiService>;
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

    controller = module.get<LegacyApiV1Controller>(LegacyApiV1Controller);
    service = module.get<ProgramContentApiService>(ProgramContentApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should log a deprecation warning when calling getHeadlineTopicProgramsCounts', async () => {
    // ログ出力のスパイを設定
    const loggerWarnSpy = jest.spyOn(controller['logger'], 'warn');
    const serviceSpy = jest
      .spyOn(service, 'getHeadlineTopicProgramsCounts')
      .mockResolvedValue(10);

    await controller.getHeadlineTopicProgramsCounts();

    // 非推奨警告がログに出力されることを確認
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '非推奨のエンドポイント(/api/v1/)が使用されました。新しいエンドポイント(/api/program-content/)を使用してください。',
    );
    expect(serviceSpy).toHaveBeenCalled();
  });
});
