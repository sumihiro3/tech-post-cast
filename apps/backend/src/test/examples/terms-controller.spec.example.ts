import { Test, TestingModule } from '@nestjs/testing';
import { TermsController } from '@/controllers/terms/terms.controller';
import { TermsService } from '@/controllers/terms/terms.service';
import { PrismaService } from '@tech-post-cast/database';
import { TermFactory } from '../factories/term.factory';
import { createTestingModuleWithMockPrisma } from '../helpers/test-module.helper';
import { suppressLogOutput, restoreLogOutput } from '../helpers/logger.helper';

describe('TermsController', () => {
  let controller: TermsController;
  let service: TermsService;
  let prisma: any;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockTermsService = {
      getTerms: jest.fn(),
      createTerm: jest.fn(),
    };

    const [module, mockPrisma] = await createTestingModuleWithMockPrisma({
      controllers: [TermsController],
      providers: [
        {
          provide: TermsService,
          useValue: mockTermsService,
        },
      ],
    });

    controller = module.get<TermsController>(TermsController);
    service = module.get<TermsService>(TermsService);
    prisma = mockPrisma;
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTerms', () => {
    it('should return terms', async () => {
      const mockTerms = TermFactory.createTerms(3);
      
      jest.spyOn(service, 'getTerms').mockResolvedValue(mockTerms);

      const result = await controller.getTerms();
      
      expect(result).toEqual(mockTerms);
      expect(service.getTerms).toHaveBeenCalledTimes(1);
    });
  });

  describe('createTerm', () => {
    it('should create a term', async () => {
      const mockTerm = TermFactory.createTerm();
      const createTermDto = {
        term: mockTerm.term,
        reading: mockTerm.reading,
      };
      
      jest.spyOn(service, 'createTerm').mockResolvedValue(mockTerm);

      const result = await controller.createTerm(createTermDto);
      
      expect(result).toEqual(mockTerm);
      expect(service.createTerm).toHaveBeenCalledWith(createTermDto);
    });
  });
});
