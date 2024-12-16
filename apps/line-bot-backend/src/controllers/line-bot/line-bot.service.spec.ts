import { AppConfigService } from '@/app-config/app-config.service';
import { HeadlineTopicProgramsRepository } from '@infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { LineBotService } from './line-bot.service';

const moduleMocker = new ModuleMocker(global);

describe('LineBotService', () => {
  let service: LineBotService;
  let appConfigService: AppConfigService;
  let headlineTopicProgramsRepository: HeadlineTopicProgramsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LineBotService],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === AppConfigService) {
          return {
            // ここに Mock したいメソッドを記述する
          } as AppConfigService;
        } else if (token === HeadlineTopicProgramsRepository) {
          return {
            // ここに Mock したいメソッドを記述する
          } as HeadlineTopicProgramsRepository;
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

    service = module.get<LineBotService>(LineBotService);
    appConfigService = module.get<AppConfigService>(AppConfigService);
    headlineTopicProgramsRepository =
      module.get<HeadlineTopicProgramsRepository>(
        HeadlineTopicProgramsRepository,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(appConfigService).toBeDefined();
    expect(headlineTopicProgramsRepository).toBeDefined();
  });
});
