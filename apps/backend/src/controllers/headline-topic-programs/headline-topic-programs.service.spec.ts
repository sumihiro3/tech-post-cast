import { HeadlineTopicProgramMaker } from '@domains/radio-program/headline-topic-program';
import { QiitaPostsApiClient } from '@infrastructure/external-api/qiita-api/qiita-posts.api.client';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { HeadlineTopicProgramsService } from './headline-topic-programs.service';

const moduleMocker = new ModuleMocker(global);

describe('HeadlineTopicProgramsService', () => {
  let service: HeadlineTopicProgramsService;
  let qiitaPostsApiClient: QiitaPostsApiClient;
  let headlineTopicProgramMaker: HeadlineTopicProgramMaker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeadlineTopicProgramsService],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === QiitaPostsApiClient) {
          return {
            // ここに Mock したいメソッドを記述する
          } as QiitaPostsApiClient;
        } else if (token === HeadlineTopicProgramMaker) {
          return {
            // ここに Mock したいメソッドを記述する
          } as HeadlineTopicProgramMaker;
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

    service = module.get<HeadlineTopicProgramsService>(
      HeadlineTopicProgramsService,
    );
    qiitaPostsApiClient = module.get<QiitaPostsApiClient>(QiitaPostsApiClient);
    headlineTopicProgramMaker = module.get<HeadlineTopicProgramMaker>(
      HeadlineTopicProgramMaker,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(qiitaPostsApiClient).toBeDefined();
    expect(headlineTopicProgramMaker).toBeDefined();
  });
});
