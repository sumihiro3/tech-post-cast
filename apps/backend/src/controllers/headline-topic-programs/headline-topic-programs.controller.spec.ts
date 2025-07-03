import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import {
  HeadlineTopicCreateRequestDto,
  HeadlineTopicRegenerateRequestDto,
} from './dto/headline-topic-programs.dto';
import { HeadlineTopicProgramsController } from './headline-topic-programs.controller';
import { HeadlineTopicProgramsService } from './headline-topic-programs.service';

const moduleMocker = new ModuleMocker(global);

describe('HeadlineTopicProgramsController', () => {
  let controller: HeadlineTopicProgramsController;
  let headlineTopicProgramsService: HeadlineTopicProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeadlineTopicProgramsController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === HeadlineTopicProgramsService) {
          return {
            createHeadlineTopicProgram: jest.fn(),
            regenerateHeadlineTopicProgram: jest.fn(),
            vectorizeHeadlineTopicProgramScript: jest.fn(),
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
    controller = module.get<HeadlineTopicProgramsController>(
      HeadlineTopicProgramsController,
    );
    headlineTopicProgramsService = module.get<HeadlineTopicProgramsService>(
      HeadlineTopicProgramsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(headlineTopicProgramsService).toBeDefined();
  });

  describe('createProgram', () => {
    it('should create a headline topic program successfully', async () => {
      const dto = new HeadlineTopicCreateRequestDto();
      dto.daysAgo = 0;
      dto.updateLp = true;

      const mockProgramDate = new Date();
      jest.spyOn(dto, 'getProgramDate').mockReturnValue(mockProgramDate);

      const mockProgram = {
        id: 'test-id',
        title: 'Test Program',
        script: '{}',
        audioUrl: 'https://example.com/audio.mp3',
        audioDuration: 1000,
        chapters: '[]',
        videoUrl: 'https://example.com/video.mp4',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(headlineTopicProgramsService, 'createHeadlineTopicProgram')
        .mockResolvedValue(mockProgram);

      await controller.createProgram(dto);

      expect(
        headlineTopicProgramsService.createHeadlineTopicProgram,
      ).toHaveBeenCalledWith(mockProgramDate, dto.updateLp);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const dto = new HeadlineTopicCreateRequestDto();
      dto.daysAgo = 0;
      dto.updateLp = true;

      const mockError = new Error('Service error');
      jest
        .spyOn(headlineTopicProgramsService, 'createHeadlineTopicProgram')
        .mockRejectedValue(mockError);

      await expect(controller.createProgram(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('regenerateProgram', () => {
    it('should regenerate a headline topic program successfully', async () => {
      const dto = new HeadlineTopicRegenerateRequestDto();
      dto.programId = 'test-id';
      dto.regenerationType = 'AUDIO_ONLY';
      dto.updateLp = true;

      const mockProgram = {
        id: 'test-id',
        title: 'Test Program',
        script: '{}',
        audioUrl: 'https://example.com/audio.mp3',
        audioDuration: 1000,
        chapters: '[]',
        videoUrl: 'https://example.com/video.mp4',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(headlineTopicProgramsService, 'regenerateHeadlineTopicProgram')
        .mockResolvedValue(mockProgram);

      await controller.regenerateProgram(dto);

      expect(
        headlineTopicProgramsService.regenerateHeadlineTopicProgram,
      ).toHaveBeenCalledWith(dto.programId, dto.regenerationType, dto.updateLp);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const dto = new HeadlineTopicRegenerateRequestDto();
      dto.programId = 'test-id';
      dto.regenerationType = 'AUDIO_ONLY';
      dto.updateLp = true;

      const mockError = new Error('Service error');
      jest
        .spyOn(headlineTopicProgramsService, 'regenerateHeadlineTopicProgram')
        .mockRejectedValue(mockError);

      await expect(controller.regenerateProgram(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('vectorizeScript', () => {
    it('should vectorize a headline topic program script successfully', async () => {
      const programId = 'test-id';

      jest
        .spyOn(
          headlineTopicProgramsService,
          'vectorizeHeadlineTopicProgramScript',
        )
        .mockResolvedValue(undefined);

      await controller.vectorizeScript(programId);

      expect(
        headlineTopicProgramsService.vectorizeHeadlineTopicProgramScript,
      ).toHaveBeenCalledWith(programId);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const programId = 'test-id';

      const mockError = new Error('Service error');
      jest
        .spyOn(
          headlineTopicProgramsService,
          'vectorizeHeadlineTopicProgramScript',
        )
        .mockRejectedValue(mockError);

      await expect(controller.vectorizeScript(programId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
