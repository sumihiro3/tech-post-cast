import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { HeadlineTopicProgramsService } from '../headline-topic-programs/headline-topic-programs.service';
import { EventsController } from './events.controller';
import { Request } from 'express';

const moduleMocker = new ModuleMocker(global);

describe('EventsController', () => {
  let controller: EventsController;
  let headlineTopicProgramsService: HeadlineTopicProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === HeadlineTopicProgramsService) {
          return {
            createHeadlineTopicProgram: jest.fn(),
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

    controller = module.get<EventsController>(EventsController);
    headlineTopicProgramsService = module.get<HeadlineTopicProgramsService>(
      HeadlineTopicProgramsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(headlineTopicProgramsService).toBeDefined();
  });

  describe('receiveEvents', () => {
    it('should receive events and create headline topic program', async () => {
      const mockDate = new Date();
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

      const mockRequest = {
        body: { source: 'aws.events', detail: {} },
      } as Request;

      jest
        .spyOn(headlineTopicProgramsService, 'createHeadlineTopicProgram')
        .mockResolvedValue(mockProgram);

      await controller.receiveEvents(mockRequest);

      expect(
        headlineTopicProgramsService.createHeadlineTopicProgram,
      ).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const mockRequest = {
        body: { source: 'aws.events', detail: {} },
      } as Request;

      const mockError = new Error('Service error');
      jest
        .spyOn(headlineTopicProgramsService, 'createHeadlineTopicProgram')
        .mockRejectedValue(mockError);

      await expect(controller.receiveEvents(mockRequest)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
