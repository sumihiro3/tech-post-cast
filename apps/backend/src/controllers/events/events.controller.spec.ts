import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { HeadlineTopicProgramsService } from '../headline-topic-programs/headline-topic-programs.service';
import { EventsController } from './events.controller';

const moduleMocker = new ModuleMocker(global);

describe('EventsController', () => {
  let controller: EventsController;
  let headlineTopicProgramsService: HeadlineTopicProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === HeadlineTopicProgramsService) {
          return {
            // ここに Mock したいメソッドを記述する
          } as HeadlineTopicProgramsService;
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

    controller = module.get<EventsController>(EventsController);
    headlineTopicProgramsService = module.get<HeadlineTopicProgramsService>(
      HeadlineTopicProgramsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(headlineTopicProgramsService).toBeDefined();
  });
});
