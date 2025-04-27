import { Test, TestingModule } from '@nestjs/testing';
import { PersonalizedFeedsController } from './personalized-feeds.controller';

describe('PersonalizedFeedsController', () => {
  let controller: PersonalizedFeedsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalizedFeedsController],
    }).compile();

    controller = module.get<PersonalizedFeedsController>(PersonalizedFeedsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
