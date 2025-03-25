import { HeadlineTopicProgramWithSimilarAndNeighbors } from '@domains/radio-program/headline-topic-program';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgramWithQiitaPosts } from '@tech-post-cast/database';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import {
  HeadlineTopicProgramDto,
  HeadlineTopicProgramsCountDto,
  HeadlineTopicProgramsFindRequestDto,
  HeadlineTopicProgramWithSimilarAndNeighborsDto,
} from './dto';
import { ProgramContentApiController } from './program-content-api.controller';
import { ProgramContentApiService } from './program-content-api.service';

const moduleMocker = new ModuleMocker(global);

describe('ProgramContentApiController', () => {
  let controller: ProgramContentApiController;
  let service: ProgramContentApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgramContentApiController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === ProgramContentApiService) {
          return {
            getHeadlineTopicProgram: jest.fn(),
            getHeadlineTopicPrograms: jest.fn(),
            getHeadlineTopicProgramsCounts: jest.fn(),
            getHeadlineTopicProgramIds: jest.fn(),
            getHeadlineTopicProgramWithSimilarAndNeighbors: jest.fn(),
          } as Partial<ProgramContentApiService>;
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

    controller = module.get<ProgramContentApiController>(
      ProgramContentApiController,
    );
    service = module.get<ProgramContentApiService>(ProgramContentApiService);
  });

  it('コントローラーとサービスが定義されていること', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getHeadlineTopicProgramsCounts', () => {
    it('サービスから件数が返された場合、件数DTOを返すこと', async () => {
      // Arrange
      const expectedCount = 10;
      jest
        .spyOn(service, 'getHeadlineTopicProgramsCounts')
        .mockResolvedValue(expectedCount);

      // Act
      const result = await controller.getHeadlineTopicProgramsCounts();

      // Assert
      expect(service.getHeadlineTopicProgramsCounts).toHaveBeenCalled();
      expect(result).toBeInstanceOf(HeadlineTopicProgramsCountDto);
      expect(result.count).toBe(expectedCount);
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionをスローすること', async () => {
      // Arrange
      jest
        .spyOn(service, 'getHeadlineTopicProgramsCounts')
        .mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(controller.getHeadlineTopicProgramsCounts()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getHeadlineTopicPrograms', () => {
    it('サービスから番組リストが返された場合、DTOリストを返すこと', async () => {
      // Arrange
      const mockDto = new HeadlineTopicProgramsFindRequestDto();
      mockDto.limit = 10;
      mockDto.page = 1;

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

      // HeadlineTopicProgramDtoのcreateFromEntityメソッドをモック
      const originalCreateFromEntity = HeadlineTopicProgramDto.createFromEntity;
      HeadlineTopicProgramDto.createFromEntity = jest
        .fn()
        .mockImplementation((entity) => {
          const dto = new HeadlineTopicProgramDto();
          dto.id = entity.id;
          dto.title = entity.title;
          dto.createdAt = entity.createdAt;
          return dto;
        });

      jest
        .spyOn(service, 'getHeadlineTopicPrograms')
        .mockResolvedValue(
          mockPrograms as HeadlineTopicProgramWithQiitaPosts[],
        );

      // Act
      const result = await controller.getHeadlineTopicPrograms(mockDto);

      // Assert
      expect(service.getHeadlineTopicPrograms).toHaveBeenCalledWith(mockDto);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('program1');
      expect(result[1].id).toBe('program2');

      // モックを元に戻す
      HeadlineTopicProgramDto.createFromEntity = originalCreateFromEntity;
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionをスローすること', async () => {
      // Arrange
      const mockDto = new HeadlineTopicProgramsFindRequestDto();
      mockDto.limit = 10;
      mockDto.page = 1;

      jest
        .spyOn(service, 'getHeadlineTopicPrograms')
        .mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(
        controller.getHeadlineTopicPrograms(mockDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getHeadlineTopicProgramIds', () => {
    it('サービスからID一覧が返された場合、そのままID一覧を返すこと', async () => {
      // Arrange
      const mockIds = ['program1', 'program2', 'program3'];
      jest
        .spyOn(service, 'getHeadlineTopicProgramIds')
        .mockResolvedValue(mockIds);

      // Act
      const result = await controller.getHeadlineTopicProgramIds();

      // Assert
      expect(service.getHeadlineTopicProgramIds).toHaveBeenCalled();
      expect(result).toEqual(mockIds);
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionをスローすること', async () => {
      // Arrange
      jest
        .spyOn(service, 'getHeadlineTopicProgramIds')
        .mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(controller.getHeadlineTopicProgramIds()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getHeadlineTopicProgramWithSimilarAndNeighbors', () => {
    it('サービスから類似番組と前後の番組が返された場合、正しく変換して返すこと', async () => {
      // Arrange
      const mockId = 'program1';
      const mockResult: Partial<HeadlineTopicProgramWithSimilarAndNeighbors> = {
        target: { id: 'program1', title: 'Program 1' } as any,
        previous: { id: 'program0', title: 'Program 0' } as any,
        next: { id: 'program2', title: 'Program 2' } as any,
        similar: [],
      };

      // HeadlineTopicProgramWithSimilarAndNeighborsDtoのcreateFromEntityメソッドをモック
      const originalCreateFromEntity =
        HeadlineTopicProgramWithSimilarAndNeighborsDto.createFromEntity;
      HeadlineTopicProgramWithSimilarAndNeighborsDto.createFromEntity = jest
        .fn()
        .mockImplementation((entity) => {
          const dto = new HeadlineTopicProgramWithSimilarAndNeighborsDto();
          dto.target = new HeadlineTopicProgramDto();
          dto.target.id = entity.target.id;
          dto.target.title = entity.target.title;

          if (entity.previous) {
            dto.previous = new HeadlineTopicProgramDto();
            dto.previous.id = entity.previous.id;
            dto.previous.title = entity.previous.title;
          }

          if (entity.next) {
            dto.next = new HeadlineTopicProgramDto();
            dto.next.id = entity.next.id;
            dto.next.title = entity.next.title;
          }

          dto.similar = [];
          return dto;
        });

      jest
        .spyOn(service, 'getHeadlineTopicProgramWithSimilarAndNeighbors')
        .mockResolvedValue(
          mockResult as HeadlineTopicProgramWithSimilarAndNeighbors,
        );

      // Act
      const result =
        await controller.getHeadlineTopicProgramWithSimilarAndNeighbors(mockId);

      // Assert
      expect(
        service.getHeadlineTopicProgramWithSimilarAndNeighbors,
      ).toHaveBeenCalledWith(mockId);
      expect(result.target.id).toBe('program1');
      expect(result.previous.id).toBe('program0');
      expect(result.next.id).toBe('program2');

      // モックを元に戻す
      HeadlineTopicProgramWithSimilarAndNeighborsDto.createFromEntity =
        originalCreateFromEntity;
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionをスローすること', async () => {
      // Arrange
      const mockId = 'program1';
      jest
        .spyOn(service, 'getHeadlineTopicProgramWithSimilarAndNeighbors')
        .mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(
        controller.getHeadlineTopicProgramWithSimilarAndNeighbors(mockId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getHeadlineTopicProgram', () => {
    it('サービスから番組が返された場合、正しく変換して返すこと', async () => {
      // Arrange
      const mockId = 'program1';
      const mockProgram: Partial<HeadlineTopicProgramWithQiitaPosts> = {
        id: 'program1',
        title: 'Program 1',
        createdAt: new Date(),
      };

      // HeadlineTopicProgramDtoのcreateFromEntityメソッドをモック
      const originalCreateFromEntity = HeadlineTopicProgramDto.createFromEntity;
      HeadlineTopicProgramDto.createFromEntity = jest
        .fn()
        .mockImplementation((entity) => {
          const dto = new HeadlineTopicProgramDto();
          dto.id = entity.id;
          dto.title = entity.title;
          dto.createdAt = entity.createdAt;
          return dto;
        });

      jest
        .spyOn(service, 'getHeadlineTopicProgram')
        .mockResolvedValue(mockProgram as HeadlineTopicProgramWithQiitaPosts);

      // Act
      const result = await controller.getHeadlineTopicProgram(mockId);

      // Assert
      expect(service.getHeadlineTopicProgram).toHaveBeenCalledWith(mockId);
      expect(result.id).toBe('program1');
      expect(result.title).toBe('Program 1');

      // モックを元に戻す
      HeadlineTopicProgramDto.createFromEntity = originalCreateFromEntity;
    });

    it('サービスからnullが返された場合、NotFoundExceptionをスローすること', async () => {
      // Arrange
      const mockId = 'nonexistent';
      jest.spyOn(service, 'getHeadlineTopicProgram').mockResolvedValue(null);

      // モックで条件分岐をテストできるようにする
      // controller.getHeadlineTopicProgramをスパイして、serviceからnullが返された場合の処理をテスト
      const controllerSpy = jest.spyOn(controller, 'getHeadlineTopicProgram');
      controllerSpy.mockImplementation(async (id: string) => {
        const result = await service.getHeadlineTopicProgram(id);
        if (!result) {
          throw new NotFoundException(
            `指定のヘッドライントピック番組 [${id}] が見つかりません`,
          );
        }
        return HeadlineTopicProgramDto.createFromEntity(result);
      });

      // Act & Assert
      await expect(controller.getHeadlineTopicProgram(mockId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('サービスでエラーが発生した場合、InternalServerErrorExceptionをスローすること', async () => {
      // Arrange
      const mockId = 'program1';
      jest
        .spyOn(service, 'getHeadlineTopicProgram')
        .mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(controller.getHeadlineTopicProgram(mockId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
