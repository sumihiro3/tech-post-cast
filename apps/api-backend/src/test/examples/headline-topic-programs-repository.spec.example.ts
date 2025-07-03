import { HeadlineTopicProgramsRepository } from '@/infrastructure/database/headline-topic-programs/headline-topic-programs.repository';
import { PrismaService } from '@tech-post-cast/database';
import { HeadlineTopicProgramFactory } from '../factories/headline-topic-program.factory';
import { restoreLogOutput, suppressLogOutput } from '../helpers/logger.helper';
import { createTestingModuleWithMockPrisma } from '../helpers/test-module.helper';

describe('HeadlineTopicProgramsRepository (Example)', () => {
  let repository: HeadlineTopicProgramsRepository;
  let prismaService: PrismaService;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const [module, mockPrismaService] = await createTestingModuleWithMockPrisma(
      {
        providers: [HeadlineTopicProgramsRepository],
      },
    );

    repository = module.get<HeadlineTopicProgramsRepository>(
      HeadlineTopicProgramsRepository,
    );
    prismaService = mockPrismaService;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  describe('findOne', () => {
    it('指定したIDのヘッドライントピック番組を取得できること', async () => {
      const mockProgram =
        HeadlineTopicProgramFactory.createHeadlineTopicProgram();
      const mockPosts = HeadlineTopicProgramFactory.createQiitaPosts(2);

      (
        prismaService.headlineTopicProgram.findUnique as jest.Mock
      ).mockResolvedValue(mockProgram);
      (prismaService.qiitaPost.findMany as jest.Mock).mockResolvedValue(
        mockPosts,
      );

      const result = await repository.findOne(mockProgram.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockProgram.id);
      expect(
        prismaService.headlineTopicProgram.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: mockProgram.id },
      });
    });
  });

  describe('createHeadlineTopicProgram', () => {
    it('ヘッドライントピック番組を作成できること', async () => {
      const mockPosts = HeadlineTopicProgramFactory.createQiitaPosts(2);
      const programGenerateResult =
        HeadlineTopicProgramFactory.createProgramGenerateResult();
      const programUploadResult =
        HeadlineTopicProgramFactory.createProgramUploadResult();
      const mockProgram =
        HeadlineTopicProgramFactory.createHeadlineTopicProgram();

      (
        prismaService.headlineTopicProgram.create as jest.Mock
      ).mockResolvedValue(mockProgram);

      const result = await repository.createHeadlineTopicProgram(
        new Date(),
        mockPosts,
        programGenerateResult,
        programUploadResult,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockProgram.id);
      expect(prismaService.headlineTopicProgram.create).toHaveBeenCalled();
    });
  });
});
