import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { CreateTermRequestDto, TermDto } from './dto';
import { TermsController } from './terms.controller';
import { TermsService } from './terms.service';

const moduleMocker = new ModuleMocker(global);

describe('TermsController', () => {
  let controller: TermsController;
  let termsService: TermsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TermsController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === TermsService) {
          return {
            createTerm: jest.fn(),
          };
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

    controller = module.get<TermsController>(TermsController);
    termsService = module.get<TermsService>(TermsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(termsService).toBeDefined();
  });

  describe('createTerm', () => {
    it('should create a term successfully', async () => {
      const dto = new CreateTermRequestDto();
      dto.term = 'agile';
      dto.reading = 'あじゃいる';

      const mockTerm: TermDto = {
        id: 1,
        term: 'agile',
        reading: 'あじゃいる',
      };

      jest.spyOn(termsService, 'createTerm').mockResolvedValue(mockTerm);

      const result = await controller.createTerm(dto);

      expect(termsService.createTerm).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTerm);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const dto = new CreateTermRequestDto();
      dto.term = 'agile';
      dto.reading = 'あじゃいる';

      const mockError = new Error('Service error');
      jest.spyOn(termsService, 'createTerm').mockRejectedValue(mockError);

      await expect(controller.createTerm(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
