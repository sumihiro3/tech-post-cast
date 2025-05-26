import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramsService } from '@/controllers/headline-topic-programs/headline-topic-programs.service';
import { PrismaService } from '@tech-post-cast/database';
import { HeadlineTopicProgramFactory } from '../factories/headline-topic-program.factory';
import { QiitaPostFactory } from '../factories/qiita-post.factory';
import { createTestingModuleWithMockPrisma } from '../helpers/test-module.helper';
import { suppressLogOutput, restoreLogOutput } from '../helpers/logger.helper';

describe('HeadlineTopicProgramsService', () => {
  let service: HeadlineTopicProgramsService;
  let prisma: any;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const [module, mockPrisma] = await createTestingModuleWithMockPrisma({
      providers: [HeadlineTopicProgramsService],
    });

    service = module.get<HeadlineTopicProgramsService>(HeadlineTopicProgramsService);
    prisma = mockPrisma;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHeadlineTopicPrograms', () => {
    it('should return headline topic programs', async () => {
      const mockPrograms = HeadlineTopicProgramFactory.createHeadlineTopicPrograms(3);
      
      prisma.headlineTopicProgram.findMany.mockResolvedValue(mockPrograms);

      const result = await service.getHeadlineTopicPrograms();
      
      expect(result).toEqual(mockPrograms);
      expect(prisma.headlineTopicProgram.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHeadlineTopicProgram', () => {
    it('should return a headline topic program by id', async () => {
      const mockProgram = HeadlineTopicProgramFactory.createHeadlineTopicProgram();
      const programId = mockProgram.id;
      
      prisma.headlineTopicProgram.findUnique.mockResolvedValue(mockProgram);

      const result = await service.getHeadlineTopicProgram(programId);
      
      expect(result).toEqual(mockProgram);
      expect(prisma.headlineTopicProgram.findUnique).toHaveBeenCalledWith({
        where: { id: programId },
      });
    });
  });
});
