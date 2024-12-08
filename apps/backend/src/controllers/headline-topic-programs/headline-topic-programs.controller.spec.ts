import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramsController } from './headline-topic-programs.controller';

describe('HeadlineTopicProgramsController', () => {
  let controller: HeadlineTopicProgramsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeadlineTopicProgramsController],
    }).compile();

    controller = module.get<HeadlineTopicProgramsController>(
      HeadlineTopicProgramsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
