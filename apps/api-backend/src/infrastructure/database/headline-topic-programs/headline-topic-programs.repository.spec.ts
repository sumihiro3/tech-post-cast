import {
  HeadlineTopicProgramGenerateResult,
  ProgramUploadResult,
} from '@domains/radio-program/headline-topic-program';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HeadlineTopicProgram, QiitaPost } from '@prisma/client';
import { PrismaService } from '@tech-post-cast/database';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { HeadlineTopicProgramsRepository } from './headline-topic-programs.repository';

describe('HeadlineTopicProgramsRepository', () => {
  let repository: HeadlineTopicProgramsRepository;
  let prismaService: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeadlineTopicProgramsRepository,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    repository = module.get<HeadlineTopicProgramsRepository>(
      HeadlineTopicProgramsRepository,
    );
    prismaService = module.get(PrismaService) as DeepMockProxy<PrismaService>;

    // Logger のモック化
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findOne', () => {
    it('特定のIDのヘッドライントピック番組を取得できること', async () => {
      // モックデータ
      const mockId = 'mock-id';
      const mockProgram = {
        id: mockId,
        title: 'テスト番組',
        posts: [{ id: 'post-1', likesCount: 10 }],
      };

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.findUnique.mockResolvedValue(
        mockProgram as any,
      );

      // メソッド実行
      const result = await repository.findOne(mockId);

      // 検証
      expect(
        prismaService.headlineTopicProgram.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: mockId },
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
            select: {
              id: true,
              title: true,
              url: true,
              authorId: true,
              authorName: true,
              likesCount: true,
              stocksCount: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              refreshedAt: true,
              private: true,
              summary: true,
              headlineTopicProgramId: true,
            },
          },
        },
      });
      expect(result).toEqual(mockProgram);
    });
  });

  describe('count', () => {
    it('ヘッドライントピック番組の総数を取得できること', async () => {
      // モックデータ
      const mockCount = 10;

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.count.mockResolvedValue(mockCount);

      // メソッド実行
      const result = await repository.count();

      // 検証
      expect(prismaService.headlineTopicProgram.count).toHaveBeenCalled();
      expect(result).toEqual(mockCount);
    });
  });

  describe('find', () => {
    it('ページネーションパラメータに基づいてヘッドライントピック番組を取得できること', async () => {
      // モックデータ
      const page = 2;
      const limit = 10;
      const mockPrograms = [
        { id: 'program-1', title: 'テスト番組1', posts: [] },
        { id: 'program-2', title: 'テスト番組2', posts: [] },
      ];

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.findMany.mockResolvedValue(
        mockPrograms as any,
      );

      // メソッド実行
      const result = await repository.find(page, limit);

      // 検証
      expect(prismaService.headlineTopicProgram.findMany).toHaveBeenCalledWith({
        take: limit,
        skip: (page - 1) * limit,
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
            select: {
              id: true,
              title: true,
              url: true,
              authorId: true,
              authorName: true,
              likesCount: true,
              stocksCount: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              refreshedAt: true,
              private: true,
              summary: true,
              headlineTopicProgramId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockPrograms);
    });

    it('limit <= 0の場合は全件を取得すること', async () => {
      // モックデータ
      const page = 1;
      const limit = 0;
      const mockCount = 15;
      const mockPrograms = [
        { id: 'program-1', title: 'テスト番組1', posts: [] },
        { id: 'program-2', title: 'テスト番組2', posts: [] },
      ];

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.count.mockResolvedValue(mockCount);
      prismaService.headlineTopicProgram.findMany.mockResolvedValue(
        mockPrograms as any,
      );

      // メソッド実行
      const result = await repository.find(page, limit);

      // 検証
      expect(prismaService.headlineTopicProgram.count).toHaveBeenCalled();
      expect(prismaService.headlineTopicProgram.findMany).toHaveBeenCalledWith({
        take: mockCount,
        skip: 0,
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
            select: {
              id: true,
              title: true,
              url: true,
              authorId: true,
              authorName: true,
              likesCount: true,
              stocksCount: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              refreshedAt: true,
              private: true,
              summary: true,
              headlineTopicProgramId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockPrograms);
    });
  });

  describe('findIds', () => {
    it('ヘッドライントピック番組のID一覧を取得できること', async () => {
      // モックデータ
      const mockProgramIds = [{ id: 'program-1' }, { id: 'program-2' }];

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.findMany.mockResolvedValue(
        mockProgramIds as any,
      );

      // メソッド実行
      const result = await repository.findIds();

      // 検証
      expect(prismaService.headlineTopicProgram.findMany).toHaveBeenCalledWith({
        select: { id: true },
      });
      expect(result).toEqual(['program-1', 'program-2']);
    });
  });

  describe('findWithSimilarAndNeighbors', () => {
    it('指定IDのヘッドライントピック番組とその類似番組および前後の番組を取得できること', async () => {
      // モックデータ
      const mockId = 'mock-id';
      const mockTarget = {
        id: mockId,
        title: 'テスト番組',
        createdAt: new Date('2023-01-15'),
        posts: [],
      };
      const mockPrevious = {
        id: 'previous-id',
        title: '前日の番組',
        createdAt: new Date('2023-01-14'),
        posts: [],
      };
      const mockNext = {
        id: 'next-id',
        title: '翌日の番組',
        createdAt: new Date('2023-01-16'),
        posts: [],
      };
      const mockSimilar = [
        { id: 'similar-1', title: '類似番組1', posts: [] },
        { id: 'similar-2', title: '類似番組2', posts: [] },
      ];

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.findUnique.mockResolvedValue(
        mockTarget as any,
      );
      prismaService.headlineTopicProgram.findFirst
        .mockResolvedValueOnce(mockPrevious as any)
        .mockResolvedValueOnce(mockNext as any);

      // findSimilarProgramsのモック
      jest
        .spyOn(repository, 'findSimilarPrograms')
        .mockResolvedValue(mockSimilar as any);

      // メソッド実行
      const result = await repository.findWithSimilarAndNeighbors(mockId);

      // 検証
      expect(
        prismaService.headlineTopicProgram.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: mockId },
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
            select: {
              id: true,
              title: true,
              url: true,
              authorId: true,
              authorName: true,
              likesCount: true,
              stocksCount: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              refreshedAt: true,
              private: true,
              summary: true,
              headlineTopicProgramId: true,
            },
          },
        },
      });
      expect(
        prismaService.headlineTopicProgram.findFirst,
      ).toHaveBeenCalledTimes(2);
      expect(repository.findSimilarPrograms).toHaveBeenCalledWith(mockId);

      expect(result).toEqual({
        target: mockTarget,
        previous: mockPrevious,
        next: mockNext,
        similar: mockSimilar,
      });
    });
  });

  describe('findSimilarPrograms', () => {
    it('類似番組を取得できること', async () => {
      // モックデータ
      const mockId = 'mock-id';
      const mockSimilarProgramsResult = [
        { id: 'similar-1', vector: 'vector1', similarity: 0.9 },
        { id: 'similar-2', vector: 'vector2', similarity: 0.8 },
        { id: mockId, vector: 'vector3', similarity: 1.0 },
        { id: 'similar-3', vector: 'vector4', similarity: 0.7 },
      ];
      const mockPrograms = [
        { id: 'similar-1', title: '類似番組1', posts: [] },
        { id: 'similar-2', title: '類似番組2', posts: [] },
        { id: 'similar-3', title: '類似番組3', posts: [] },
      ];

      // Prismaのモックを設定
      prismaService.$queryRaw.mockResolvedValue(mockSimilarProgramsResult);
      prismaService.headlineTopicProgram.findMany.mockResolvedValue(
        mockPrograms as any,
      );

      // メソッド実行
      const result = await repository.findSimilarPrograms(mockId);

      // 検証
      expect(prismaService.$queryRaw).toHaveBeenCalled();
      expect(prismaService.headlineTopicProgram.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['similar-1', 'similar-2', 'similar-3'] } },
        include: {
          posts: {
            orderBy: { likesCount: 'desc' },
            select: {
              id: true,
              title: true,
              url: true,
              authorId: true,
              authorName: true,
              likesCount: true,
              stocksCount: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              refreshedAt: true,
              private: true,
              summary: true,
              headlineTopicProgramId: true,
            },
          },
        },
      });
      // 類似度でソートされていることを確認
      expect(result[0].id).toBe('similar-1');
      expect(result[1].id).toBe('similar-2');
      expect(result[2].id).toBe('similar-3');
    });
  });

  describe('createHeadlineTopicProgram', () => {
    it('ヘッドライントピック番組を新規作成できること', async () => {
      // モックデータ
      const programDate = new Date('2023-01-15');
      const posts: QiitaPost[] = [
        { id: 'post-1', title: '記事1', likesCount: 10 } as QiitaPost,
        { id: 'post-2', title: '記事2', likesCount: 5 } as QiitaPost,
      ];
      const programGenerateResult: HeadlineTopicProgramGenerateResult = {
        script: {
          title: 'テスト番組',
          intro: 'イントロ',
          posts: [{ summary: '記事1の要約' }, { summary: '記事2の要約' }],
          ending: 'エンディング',
        },
        chapters: [
          { title: 'イントロ', startTime: 0, endTime: 5000 },
          { title: '記事紹介', startTime: 5000, endTime: 10000 },
        ],
        audioPath: '/path/to/audio.mp3',
        audioDuration: 10000,
      };
      const programUploadResult: ProgramUploadResult = {
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        imageUrl: 'https://example.com/image.jpg',
      };
      const mockCreatedProgram: HeadlineTopicProgram = {
        id: 'new-program-id',
        title: 'テスト番組',
        audioDuration: 10000,
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        imageUrl: 'https://example.com/image.jpg',
        script: JSON.stringify(programGenerateResult.script),
        chapters: JSON.stringify(programGenerateResult.chapters),
        createdAt: programDate,
        updatedAt: expect.any(Date),
      } as HeadlineTopicProgram;

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.create.mockResolvedValue(
        mockCreatedProgram,
      );

      // メソッド実行
      const result = await repository.createHeadlineTopicProgram(
        programDate,
        posts,
        programGenerateResult,
        programUploadResult,
      );

      // 検証
      expect(prismaService.headlineTopicProgram.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: programGenerateResult.script.title,
          audioDuration: programGenerateResult.audioDuration,
          audioUrl: programUploadResult.audioUrl,
          videoUrl: programUploadResult.videoUrl,
          imageUrl: programUploadResult.imageUrl,
          script: expect.any(String),
          chapters: expect.any(String),
          createdAt: programDate,
          updatedAt: expect.any(Date),
          posts: {
            connect: [{ id: 'post-1' }, { id: 'post-2' }],
          },
        }),
      });
      expect(result).toEqual(mockCreatedProgram);
    });
  });

  describe('updateHeadlineTopicProgram', () => {
    it('ヘッドライントピック番組を更新できること', async () => {
      // モックデータ
      const programId = 'program-id';
      const programGenerateResult: HeadlineTopicProgramGenerateResult = {
        script: {
          title: '更新後のテスト番組',
          intro: '更新後のイントロ',
          posts: [{ summary: '記事1の更新後の要約' }],
          ending: '更新後のエンディング',
        },
        chapters: [
          { title: '更新後のイントロ', startTime: 0, endTime: 6000 },
          { title: '更新後の記事紹介', startTime: 6000, endTime: 12000 },
        ],
        audioPath: '/path/to/updated-audio.mp3',
        audioDuration: 12000,
      };
      const programUploadResult: ProgramUploadResult = {
        audioUrl: 'https://example.com/updated-audio.mp3',
        videoUrl: 'https://example.com/updated-video.mp4',
        imageUrl: 'https://example.com/updated-image.jpg',
      };
      const mockUpdatedProgram: HeadlineTopicProgram = {
        id: programId,
        title: '更新後のテスト番組',
        audioDuration: 12000,
        audioUrl: 'https://example.com/updated-audio.mp3',
        videoUrl: 'https://example.com/updated-video.mp4',
        imageUrl: 'https://example.com/updated-image.jpg',
        script: JSON.stringify(programGenerateResult.script),
        chapters: JSON.stringify(programGenerateResult.chapters),
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
      } as HeadlineTopicProgram;

      // Prismaのモックを設定
      prismaService.headlineTopicProgram.update.mockResolvedValue(
        mockUpdatedProgram,
      );

      // メソッド実行
      const result = await repository.updateHeadlineTopicProgram(
        programId,
        programGenerateResult,
        programUploadResult,
      );

      // 検証
      expect(prismaService.headlineTopicProgram.update).toHaveBeenCalledWith({
        data: {
          title: programGenerateResult.script.title,
          audioDuration: programGenerateResult.audioDuration,
          audioUrl: programUploadResult.audioUrl,
          videoUrl: programUploadResult.videoUrl,
          imageUrl: programUploadResult.imageUrl,
          script: expect.any(String),
          chapters: expect.any(String),
        },
        where: { id: programId },
      });
      expect(result).toEqual(mockUpdatedProgram);
    });
  });
});
