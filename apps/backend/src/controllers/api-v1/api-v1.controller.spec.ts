import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { ApiV1Controller } from './api-v1.controller';
import { ApiV1Service } from './api-v1.service';
import {
  HeadlineTopicProgramDto,
  HeadlineTopicProgramsFindRequestDto,
  HeadlineTopicProgramWithSimilarAndNeighborsDto,
  HeadlineTopicProgramScriptDto,
  HeadlineTopicProgramChapterDto,
  QiitaPostDto,
  PostSummaryDto,
} from './dto';

const moduleMocker = new ModuleMocker(global);

describe('ApiV1Controller', () => {
  let controller: ApiV1Controller;
  let service: ApiV1Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiV1Controller],
    })
      .useMocker((token) => {
        // Service の各メソッドを Mock 化する
        if (token === ApiV1Service) {
          return {
            getHeadlineTopicProgramsCounts: jest.fn(),
            getHeadlineTopicPrograms: jest.fn(),
            getHeadlineTopicProgramIds: jest.fn(),
            getHeadlineTopicProgramWithSimilarAndNeighbors: jest.fn(),
            getHeadlineTopicProgram: jest.fn(),
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

    controller = module.get<ApiV1Controller>(ApiV1Controller);
    service = module.get<ApiV1Service>(ApiV1Service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getHeadlineTopicProgramsCounts', () => {
    it('should return the count of headline topic programs', async () => {
      const mockCount = 42;
      jest
        .spyOn(service, 'getHeadlineTopicProgramsCounts')
        .mockResolvedValue(mockCount);

      const result = await controller.getHeadlineTopicProgramsCounts();

      expect(service.getHeadlineTopicProgramsCounts).toHaveBeenCalled();
      expect(result.count).toBe(mockCount);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const mockError = new Error('Service error');
      jest
        .spyOn(service, 'getHeadlineTopicProgramsCounts')
        .mockRejectedValue(mockError);

      await expect(controller.getHeadlineTopicProgramsCounts()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getHeadlineTopicPrograms', () => {
    it('should return a list of headline topic programs', async () => {
      const dto = new HeadlineTopicProgramsFindRequestDto();
      dto.limit = 10;
      dto.page = 1;

      const mockPrograms = [
        {
          id: 'test-id-1',
          title: 'Test Program 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          audioUrl: 'https://example.com/audio1.mp3',
          audioDuration: 1000,
          script: JSON.stringify({
            title: 'Test',
            intro: 'Intro',
            posts: [],
            ending: 'Ending',
          }),
          chapters: JSON.stringify([]),
          videoUrl: 'https://example.com/video1.mp4',
          imageUrl: 'https://example.com/image1.jpg',
          posts: [
            {
              id: 'post-1',
              title: 'Test Post 1',
              createdAt: new Date(),
              updatedAt: new Date(),
              url: 'https://example.com/post1',
              authorName: 'Author 1',
              authorId: 'author-1',
              likesCount: 10,
              stocksCount: 5,
              private: false,
              refreshedAt: new Date(),
              summary: 'Test summary 1',
              headlineTopicProgramId: 'test-id-1',
              tags: [],
            },
          ],
        },
        {
          id: 'test-id-2',
          title: 'Test Program 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          audioUrl: 'https://example.com/audio2.mp3',
          audioDuration: 2000,
          script: JSON.stringify({
            title: 'Test',
            intro: 'Intro',
            posts: [],
            ending: 'Ending',
          }),
          chapters: JSON.stringify([]),
          videoUrl: 'https://example.com/video2.mp4',
          imageUrl: 'https://example.com/image2.jpg',
          posts: [
            {
              id: 'post-2',
              title: 'Test Post 2',
              createdAt: new Date(),
              updatedAt: new Date(),
              url: 'https://example.com/post2',
              authorName: 'Author 2',
              authorId: 'author-2',
              likesCount: 20,
              stocksCount: 10,
              private: false,
              refreshedAt: new Date(),
              summary: 'Test summary 2',
              headlineTopicProgramId: 'test-id-2',
              tags: [],
            },
          ],
        },
      ];

      jest
        .spyOn(service, 'getHeadlineTopicPrograms')
        .mockResolvedValue(mockPrograms);
      jest
        .spyOn(HeadlineTopicProgramDto, 'createFromEntity')
        .mockImplementation((entity) => {
          const dto = new HeadlineTopicProgramDto();
          dto.id = entity.id;
          dto.title = entity.title;
          dto.createdAt = entity.createdAt;
          dto.updatedAt = entity.updatedAt;
          dto.audioUrl = entity.audioUrl;
          dto.audioDuration = entity.audioDuration;

          const scriptDto = new HeadlineTopicProgramScriptDto();
          scriptDto.title = 'Test Title';
          scriptDto.intro = 'Test Intro';
          scriptDto.posts = [];
          scriptDto.ending = 'Test Ending';
          dto.script = scriptDto;

          dto.chapters = [];

          dto.posts = entity.posts
            ? entity.posts.map((post) => {
                const postDto = new QiitaPostDto();
                postDto.id = post.id;
                postDto.title = post.title;
                postDto.url = post.url;
                postDto.createdAt = post.createdAt;
                postDto.authorName = post.authorName;
                postDto.authorId = post.authorId;
                return postDto;
              })
            : [];

          return dto;
        });

      const result = await controller.getHeadlineTopicPrograms(dto);

      expect(service.getHeadlineTopicPrograms).toHaveBeenCalledWith(dto);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('test-id-1');
      expect(result[1].id).toBe('test-id-2');
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const dto = new HeadlineTopicProgramsFindRequestDto();
      dto.limit = 10;
      dto.page = 1;

      const mockError = new Error('Service error');
      jest
        .spyOn(service, 'getHeadlineTopicPrograms')
        .mockRejectedValue(mockError);

      await expect(controller.getHeadlineTopicPrograms(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getHeadlineTopicProgramIds', () => {
    it('should return a list of headline topic program ids', async () => {
      const mockIds = ['id-1', 'id-2', 'id-3'];
      jest
        .spyOn(service, 'getHeadlineTopicProgramIds')
        .mockResolvedValue(mockIds);

      const result = await controller.getHeadlineTopicProgramIds();

      expect(service.getHeadlineTopicProgramIds).toHaveBeenCalled();
      expect(result).toEqual(mockIds);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const mockError = new Error('Service error');
      jest
        .spyOn(service, 'getHeadlineTopicProgramIds')
        .mockRejectedValue(mockError);

      await expect(controller.getHeadlineTopicProgramIds()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getHeadlineTopicProgramWithSimilarAndNeighbors', () => {
    it('should return a headline topic program with similar and neighbors', async () => {
      const programId = 'test-id';
      const mockResult = {
        similar: [],
        previous: {
          id: 'prev-id',
          title: 'Previous Program',
          createdAt: new Date(),
          updatedAt: new Date(),
          audioUrl: 'https://example.com/audio-prev.mp3',
          audioDuration: 1000,
          script: JSON.stringify({
            title: 'Test',
            intro: 'Intro',
            posts: [],
            ending: 'Ending',
          }),
          chapters: JSON.stringify([]),
          videoUrl: 'https://example.com/video-prev.mp4',
          imageUrl: 'https://example.com/image-prev.jpg',
          posts: [
            {
              id: 'post-prev',
              title: 'Previous Post',
              createdAt: new Date(),
              updatedAt: new Date(),
              url: 'https://example.com/post-prev',
              authorName: 'Author Prev',
              authorId: 'author-prev',
              likesCount: 5,
              stocksCount: 2,
              private: false,
              refreshedAt: new Date(),
              summary: 'Previous summary',
              headlineTopicProgramId: 'prev-id',
              tags: [],
            },
          ],
        },
        target: {
          id: 'test-id',
          title: 'Test Program',
          createdAt: new Date(),
          updatedAt: new Date(),
          audioUrl: 'https://example.com/audio.mp3',
          audioDuration: 1500,
          script: JSON.stringify({
            title: 'Test',
            intro: 'Intro',
            posts: [],
            ending: 'Ending',
          }),
          chapters: JSON.stringify([]),
          videoUrl: 'https://example.com/video.mp4',
          imageUrl: 'https://example.com/image.jpg',
          posts: [
            {
              id: 'post-target',
              title: 'Target Post',
              createdAt: new Date(),
              updatedAt: new Date(),
              url: 'https://example.com/post-target',
              authorName: 'Author Target',
              authorId: 'author-target',
              likesCount: 15,
              stocksCount: 7,
              private: false,
              refreshedAt: new Date(),
              summary: 'Target summary',
              headlineTopicProgramId: 'test-id',
              tags: [],
            },
          ],
        },
        next: {
          id: 'next-id',
          title: 'Next Program',
          createdAt: new Date(),
          updatedAt: new Date(),
          audioUrl: 'https://example.com/audio-next.mp3',
          audioDuration: 2000,
          script: JSON.stringify({
            title: 'Test',
            intro: 'Intro',
            posts: [],
            ending: 'Ending',
          }),
          chapters: JSON.stringify([]),
          videoUrl: 'https://example.com/video-next.mp4',
          imageUrl: 'https://example.com/image-next.jpg',
          posts: [
            {
              id: 'post-next',
              title: 'Next Post',
              createdAt: new Date(),
              updatedAt: new Date(),
              url: 'https://example.com/post-next',
              authorName: 'Author Next',
              authorId: 'author-next',
              likesCount: 25,
              stocksCount: 12,
              private: false,
              refreshedAt: new Date(),
              summary: 'Next summary',
              headlineTopicProgramId: 'next-id',
              tags: [],
            },
          ],
        },
      };

      jest
        .spyOn(service, 'getHeadlineTopicProgramWithSimilarAndNeighbors')
        .mockResolvedValue(mockResult);
      jest
        .spyOn(
          HeadlineTopicProgramWithSimilarAndNeighborsDto,
          'createFromEntity',
        )
        .mockImplementation(() => {
          const dto = new HeadlineTopicProgramWithSimilarAndNeighborsDto();
          dto.similar = [];
          dto.previous = new HeadlineTopicProgramDto();
          dto.previous.id = 'prev-id';
          dto.target = new HeadlineTopicProgramDto();
          dto.target.id = 'test-id';
          dto.next = new HeadlineTopicProgramDto();
          dto.next.id = 'next-id';
          return dto;
        });

      const result =
        await controller.getHeadlineTopicProgramWithSimilarAndNeighbors(
          programId,
        );

      expect(
        service.getHeadlineTopicProgramWithSimilarAndNeighbors,
      ).toHaveBeenCalledWith(programId);
      expect(result.target.id).toBe('test-id');
      expect(result.previous.id).toBe('prev-id');
      expect(result.next.id).toBe('next-id');
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const programId = 'test-id';
      const mockError = new Error('Service error');
      jest
        .spyOn(service, 'getHeadlineTopicProgramWithSimilarAndNeighbors')
        .mockRejectedValue(mockError);

      await expect(
        controller.getHeadlineTopicProgramWithSimilarAndNeighbors(programId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getHeadlineTopicProgram', () => {
    it('should return a headline topic program by id', async () => {
      const programId = 'test-id';
      const mockProgram = {
        id: 'test-id',
        title: 'Test Program',
        createdAt: new Date(),
        updatedAt: new Date(),
        audioUrl: 'https://example.com/audio.mp3',
        audioDuration: 1500,
        script: JSON.stringify({
          title: 'Test',
          intro: 'Intro',
          posts: [],
          ending: 'Ending',
        }),
        chapters: JSON.stringify([]),
        videoUrl: 'https://example.com/video.mp4',
        imageUrl: 'https://example.com/image.jpg',
        posts: [
          {
            id: 'post-single',
            title: 'Single Post',
            createdAt: new Date(),
            updatedAt: new Date(),
            url: 'https://example.com/post-single',
            authorName: 'Author Single',
            authorId: 'author-single',
            likesCount: 30,
            stocksCount: 15,
            private: false,
            refreshedAt: new Date(),
            summary: 'Single post summary',
            headlineTopicProgramId: 'test-id',
            tags: [],
          },
        ],
      };

      jest
        .spyOn(service, 'getHeadlineTopicProgram')
        .mockResolvedValue(mockProgram);
      jest
        .spyOn(HeadlineTopicProgramDto, 'createFromEntity')
        .mockImplementation((entity) => {
          const dto = new HeadlineTopicProgramDto();
          dto.id = entity.id;
          dto.title = entity.title;
          dto.createdAt = entity.createdAt;
          dto.updatedAt = entity.updatedAt;
          dto.audioUrl = entity.audioUrl;
          dto.audioDuration = entity.audioDuration;

          const scriptDto = new HeadlineTopicProgramScriptDto();
          scriptDto.title = 'Test Title';
          scriptDto.intro = 'Test Intro';
          scriptDto.posts = [];
          scriptDto.ending = 'Test Ending';
          dto.script = scriptDto;

          dto.chapters = [];

          dto.posts = entity.posts
            ? entity.posts.map((post) => {
                const postDto = new QiitaPostDto();
                postDto.id = post.id;
                postDto.title = post.title;
                postDto.url = post.url;
                postDto.createdAt = post.createdAt;
                postDto.authorName = post.authorName;
                postDto.authorId = post.authorId;
                return postDto;
              })
            : [];

          return dto;
        });

      const result = await controller.getHeadlineTopicProgram(programId);

      expect(service.getHeadlineTopicProgram).toHaveBeenCalledWith(programId);
      expect(result.id).toBe('test-id');
      expect(result.title).toBe('Test Program');
    });

    it('should throw InternalServerErrorException when program is not found', async () => {
      const programId = 'non-existent-id';
      jest.spyOn(service, 'getHeadlineTopicProgram').mockResolvedValue(null);

      await expect(
        controller.getHeadlineTopicProgram(programId),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      const programId = 'test-id';
      const mockError = new Error('Service error');
      jest
        .spyOn(service, 'getHeadlineTopicProgram')
        .mockRejectedValue(mockError);

      await expect(
        controller.getHeadlineTopicProgram(programId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
