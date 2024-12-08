import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramsService } from './headline-topic-programs.service';

describe('HeadlineTopicProgramsService', () => {
  let service: HeadlineTopicProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeadlineTopicProgramsService],
    }).compile();

    service = module.get<HeadlineTopicProgramsService>(
      HeadlineTopicProgramsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
