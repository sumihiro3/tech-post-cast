import { HeadlineTopicProgramFindError } from '@/types/errors/headline-topic-program.error';
import { HeadlineTopicProgramWithSimilarAndNeighbors } from '@domains/radio-program/headline-topic-program';
import { IHeadlineTopicProgramsRepository } from '@domains/radio-program/headline-topic-program/headline-topic-programs.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { HeadlineTopicProgramsFindRequestDto } from './dto';
import { ProgramContentApiService } from './program-content-api.service';

const moduleMocker = new ModuleMocker(global);

describe('ProgramContentApiService', () => {
  let service: ProgramContentApiService;
  let repository: IHeadlineTopicProgramsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramContentApiService],
    })
      .useMocker((token) => {
        if (token === 'HeadlineTopicProgramsRepository') {
          return {
            findOne: jest.fn(),
            findWithSimilarAndNeighbors: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
            findIds: jest.fn(),
          } as Partial<IHeadlineTopicProgramsRepository>;
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

    service = module.get<ProgramContentApiService>(ProgramContentApiService);
    repository = module.get<IHeadlineTopicProgramsRepository>(
      'HeadlineTopicProgramsRepository',
    );
  });

  it('サービスとリポジトリが定義されていること', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('getHeadlineTopicProgram', () => {
    it('リポジトリから番組が返された場合、その番組を返すこと', async () => {
      // Arrange
      const mockId = 'program1';
      const mockProgram: Partial<HeadlineTopicProgramWithQiitaPosts> = {
        id: mockId,
        title: 'Program 1',
        createdAt: new Date(),
      };
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockProgram as HeadlineTopicProgramWithQiitaPosts);

      // Act
      const result = await service.getHeadlineTopicProgram(mockId);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockProgram);
    });

    it('リポジトリでエラーが発生した場合、HeadlineTopicProgramFindErrorをスローすること', async () => {
      // Arrange
      const mockId = 'program1';
      const mockError = new Error('Repository error');
      jest.spyOn(repository, 'findOne').mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getHeadlineTopicProgram(mockId)).rejects.toThrow(
        HeadlineTopicProgramFindError,
      );
    });
  });

  describe('getHeadlineTopicProgramWithSimilarAndNeighbors', () => {
    it('リポジトリから類似番組と前後の番組が返された場合、それらを返すこと', async () => {
      // Arrange
      const mockId = 'program1';
      const mockResult: Partial<HeadlineTopicProgramWithSimilarAndNeighbors> = {
        target: { id: 'program1', title: 'Program 1' } as any,
        previous: { id: 'program0', title: 'Program 0' } as any,
        next: { id: 'program2', title: 'Program 2' } as any,
        similar: [],
      };
      jest
        .spyOn(repository, 'findWithSimilarAndNeighbors')
        .mockResolvedValue(
          mockResult as HeadlineTopicProgramWithSimilarAndNeighbors,
        );

      // Act
      const result =
        await service.getHeadlineTopicProgramWithSimilarAndNeighbors(mockId);

      // Assert
      expect(repository.findWithSimilarAndNeighbors).toHaveBeenCalledWith(
        mockId,
      );
      expect(result).toEqual(mockResult);
    });

    it('リポジトリでエラーが発生した場合、HeadlineTopicProgramFindErrorをスローすること', async () => {
      // Arrange
      const mockId = 'program1';
      const mockError = new Error('Repository error');
      jest
        .spyOn(repository, 'findWithSimilarAndNeighbors')
        .mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        service.getHeadlineTopicProgramWithSimilarAndNeighbors(mockId),
      ).rejects.toThrow(HeadlineTopicProgramFindError);
    });
  });

  describe('getHeadlineTopicProgramsCounts', () => {
    it('リポジトリから件数が返された場合、その件数を返すこと', async () => {
      // Arrange
      const mockCount = 10;
      jest.spyOn(repository, 'count').mockResolvedValue(mockCount);

      // Act
      const result = await service.getHeadlineTopicProgramsCounts();

      // Assert
      expect(repository.count).toHaveBeenCalled();
      expect(result).toEqual(mockCount);
    });

    it('リポジトリでエラーが発生した場合、HeadlineTopicProgramFindErrorをスローすること', async () => {
      // Arrange
      const mockError = new Error('Repository error');
      jest.spyOn(repository, 'count').mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getHeadlineTopicProgramsCounts()).rejects.toThrow(
        HeadlineTopicProgramFindError,
      );
    });
  });

  describe('getHeadlineTopicPrograms', () => {
    it('リポジトリから番組リストが返された場合、その番組リストを返すこと', async () => {
      // Arrange
      const mockDto = new HeadlineTopicProgramsFindRequestDto();
      mockDto.page = 1;
      mockDto.limit = 10;

      const mockPrograms: Partial<HeadlineTopicProgramWithQiitaPosts>[] = [
        {
          id: 'program1',
          title: 'Program 1',
          createdAt: new Date(),
        },
        {
          id: 'program2',
          title: 'Program 2',
          createdAt: new Date(),
        },
      ];

      jest
        .spyOn(repository, 'find')
        .mockResolvedValue(
          mockPrograms as HeadlineTopicProgramWithQiitaPosts[],
        );

      // Act
      const result = await service.getHeadlineTopicPrograms(mockDto);

      // Assert
      expect(repository.find).toHaveBeenCalledWith(mockDto.page, mockDto.limit);
      expect(result).toEqual(mockPrograms);
    });

    it('リポジトリでエラーが発生した場合、HeadlineTopicProgramFindErrorをスローすること', async () => {
      // Arrange
      const mockDto = new HeadlineTopicProgramsFindRequestDto();
      mockDto.page = 1;
      mockDto.limit = 10;

      const mockError = new Error('Repository error');
      jest.spyOn(repository, 'find').mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getHeadlineTopicPrograms(mockDto)).rejects.toThrow(
        HeadlineTopicProgramFindError,
      );
    });
  });

  describe('getHeadlineTopicProgramIds', () => {
    it('リポジトリからID一覧が返された場合、そのID一覧を返すこと', async () => {
      // Arrange
      const mockIds = ['program1', 'program2', 'program3'];
      jest.spyOn(repository, 'findIds').mockResolvedValue(mockIds);

      // Act
      const result = await service.getHeadlineTopicProgramIds();

      // Assert
      expect(repository.findIds).toHaveBeenCalled();
      expect(result).toEqual(mockIds);
    });

    it('リポジトリでエラーが発生した場合、HeadlineTopicProgramFindErrorをスローすること', async () => {
      // Arrange
      const mockError = new Error('Repository error');
      jest.spyOn(repository, 'findIds').mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getHeadlineTopicProgramIds()).rejects.toThrow(
        HeadlineTopicProgramFindError,
      );
    });
  });
});
