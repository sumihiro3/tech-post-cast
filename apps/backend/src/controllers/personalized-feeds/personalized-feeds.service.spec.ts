import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizedFeedsService } from './personalized-feeds.service';

describe('PersonalizedFeedsService', () => {
  let service: PersonalizedFeedsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalizedFeedsService],
    }).compile();

    service = module.get<PersonalizedFeedsService>(PersonalizedFeedsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
