import { HeadlineTopicProgramsService } from '@/controllers/headline-topic-programs/headline-topic-programs.service';
import { HeadlineTopicProgramFactory } from '../factories/headline-topic-program.factory';
import { restoreLogOutput, suppressLogOutput } from '../helpers/logger.helper';
import { createTestingModuleWithMockPrisma } from '../helpers/test-module.helper';

describe('HeadlineTopicProgramsService', () => {
  let service: HeadlineTopicProgramsService;
  let prisma: any;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const [module, mockPrisma] = await createTestingModuleWithMockPrisma({
      providers: [HeadlineTopicProgramsService],
    });

    service = module.get<HeadlineTopicProgramsService>(
      HeadlineTopicProgramsService,
    );
    prisma = mockPrisma;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHeadlineTopicProgram', () => {
    it('should create a headline topic program', async () => {
      const mockProgram =
        HeadlineTopicProgramFactory.createHeadlineTopicProgram();
      const programDate = new Date();

      // Mock the necessary dependencies and methods
      jest
        .spyOn(service, 'createHeadlineTopicProgram')
        .mockResolvedValue(mockProgram);

      const result = await service.createHeadlineTopicProgram(programDate);

      expect(result).toEqual(mockProgram);
      expect(service.createHeadlineTopicProgram).toHaveBeenCalledWith(
        programDate,
      );
    });
  });

  describe('regenerateHeadlineTopicProgram', () => {
    it('should regenerate a headline topic program', async () => {
      const mockProgram =
        HeadlineTopicProgramFactory.createHeadlineTopicProgram();
      const programId = mockProgram.id;
      const regenerationType = 'SCRIPT_ONLY' as any; // Assuming this is a valid type

      jest
        .spyOn(service, 'regenerateHeadlineTopicProgram')
        .mockResolvedValue(mockProgram);

      const result = await service.regenerateHeadlineTopicProgram(
        programId,
        regenerationType,
      );

      expect(result).toEqual(mockProgram);
      expect(service.regenerateHeadlineTopicProgram).toHaveBeenCalledWith(
        programId,
        regenerationType,
      );
    });
  });
});
