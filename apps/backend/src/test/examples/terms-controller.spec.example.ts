import { TermsController } from '@/controllers/terms/terms.controller';
import { TermsService } from '@/controllers/terms/terms.service';
import { TermFactory } from '../factories/term.factory';
import { restoreLogOutput, suppressLogOutput } from '../helpers/logger.helper';
import { createTestingModuleWithMockPrisma } from '../helpers/test-module.helper';

describe('TermsController', () => {
  let controller: TermsController;
  let service: TermsService;
  let prisma: any;
  let logSpies: jest.SpyInstance[];

  beforeEach(async () => {
    logSpies = suppressLogOutput();

    const mockTermsService = {
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
