import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { IHeadlineTopicProgramsRepository } from '../../domains/radio-program/headline-topic-program/headline-topic-programs.repository.interface';
import { ApiV1Service } from './api-v1.service';

const moduleMocker = new ModuleMocker(global);

describe('ApiV1Service', () => {
  let service: ApiV1Service;
  let headlineTopicProgramsRepository: IHeadlineTopicProgramsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiV1Service],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === 'HeadlineTopicProgramsRepository') {
          return {
            // ここに Mock したいメソッドを記述する
          } as IHeadlineTopicProgramsRepository;
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

    service = module.get<ApiV1Service>(ApiV1Service);
    headlineTopicProgramsRepository =
      module.get<IHeadlineTopicProgramsRepository>(
        'HeadlineTopicProgramsRepository',
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(headlineTopicProgramsRepository).toBeDefined();
  });
});
