import { PersonalRssGenerator, RssProgram, RssUser } from './personal-rss.generator';
import { RssGenerationOptions } from './types/rss-feed.types';

describe('PersonalRssGenerator', () => {
  const mockUser: RssUser = {
    id: 'user-123',
    displayName: 'テストユーザー',
    rssToken: 'test-rss-token-123',
  };

  const mockPrograms: RssProgram[] = [
    {
      id: 'program-1',
      title: 'React 18の新機能について',
      audioUrl: 'https://example.com/audio/program-1.mp3',
      audioDuration: 180000, // 3分（ミリ秒）
      createdAt: new Date('2024-12-10T10:00:00Z'),
      imageUrl: 'https://example.com/images/program-1.jpg',
    },
    {
      id: 'program-2',
      title: 'TypeScriptの型安全性',
      audioUrl: 'https://example.com/audio/program-2.mp3',
      audioDuration: 240000, // 4分（ミリ秒）
      createdAt: new Date('2024-12-09T10:00:00Z'),
    },
  ];

  const mockOptions: RssGenerationOptions = {
    maxEpisodes: 30,
    baseUrl: 'https://techpostcast.com',
    rssUrlPrefix: 'https://rss.techpostcast.com',
    defaultImageUrl: 'https://techpostcast.com/images/tech-post-cast-logo.png',
    authorEmail: 'test@techpostcast.com',
    authorName: 'Test Author',
  };

  describe('generateUserRss', () => {
    it('正常なRSSフィードを生成できる', () => {
      const result = PersonalRssGenerator.generateUserRss(mockUser, mockPrograms, mockOptions);

      expect(result.xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.xml).toContain('version="2.0"');
      expect(result.xml).toContain('Tech Post Cast - テストユーザーのパーソナルプログラム');
      expect(result.xml).toContain('React 18の新機能について');
      expect(result.xml).toContain('TypeScriptの型安全性');
      expect(result.xml).toContain('test@techpostcast.com');
      expect(result.xml).toContain('https://techpostcast.com/images/tech-post-cast-logo.png');
      expect(result.episodeCount).toBe(2);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('プログラムが新しい順にソートされる', () => {
      const result = PersonalRssGenerator.generateUserRss(mockUser, mockPrograms, mockOptions);

      // 新しいプログラム（program-1）が先に来ることを確認
      const program1Index = result.xml.indexOf('React 18の新機能について');
      const program2Index = result.xml.indexOf('TypeScriptの型安全性');
      expect(program1Index).toBeLessThan(program2Index);
    });

    it('最大エピソード数でフィルタリングされる', () => {
      const manyPrograms = Array.from({ length: 50 }, (_, i) => ({
        id: `program-${i}`,
        title: `プログラム ${i}`,
        audioUrl: `https://example.com/audio/program-${i}.mp3`,
        audioDuration: 180000,
        createdAt: new Date(`2024-12-${(i % 30) + 1}T10:00:00Z`),
      }));

      const optionsWithLimit: RssGenerationOptions = {
        ...mockOptions,
        maxEpisodes: 10,
      };

      const result = PersonalRssGenerator.generateUserRss(mockUser, manyPrograms, optionsWithLimit);

      expect(result.episodeCount).toBe(10);
    });

    it('プログラムが空の場合でもRSSフィードを生成できる', () => {
      const result = PersonalRssGenerator.generateUserRss(mockUser, [], mockOptions);

      expect(result.xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.xml).toContain('Tech Post Cast - テストユーザーのパーソナルプログラム');
      expect(result.episodeCount).toBe(0);
    });

    it('音声の長さが正しく秒に変換される', () => {
      const result = PersonalRssGenerator.generateUserRss(mockUser, mockPrograms, mockOptions);

      // 180000ミリ秒 = 180秒
      expect(result.xml).toContain('<itunes:duration>180</itunes:duration>');
      // 240000ミリ秒 = 240秒
      expect(result.xml).toContain('<itunes:duration>240</itunes:duration>');
    });

    it('XMLエスケープが正しく行われる', () => {
      const userWithSpecialChars: RssUser = {
        ...mockUser,
        displayName: 'テスト<ユーザー>&"特殊文字"',
      };

      const programWithSpecialChars: RssProgram = {
        ...mockPrograms[0],
        title: 'React & Vue.js <比較> "フレームワーク"',
      };

      const result = PersonalRssGenerator.generateUserRss(
        userWithSpecialChars,
        [programWithSpecialChars],
        mockOptions,
      );

      // RSSライブラリはCDATAセクションを使用するため、特殊文字はエスケープされない
      expect(result.xml).toContain('テスト<ユーザー>&"特殊文字"');
      expect(result.xml).toContain('React & Vue.js <比較> "フレームワーク"');
    });

    it('authorEmailが未指定の場合はデフォルト値が使用される', () => {
      const optionsWithoutEmail: RssGenerationOptions = {
        ...mockOptions,
        authorEmail: undefined,
      };

      const result = PersonalRssGenerator.generateUserRss(
        mockUser,
        mockPrograms,
        optionsWithoutEmail,
      );

      expect(result.xml).toContain('info@techpostcast.com');
    });

    it('authorNameが指定された場合は指定された値が使用される', () => {
      const optionsWithAuthorName: RssGenerationOptions = {
        ...mockOptions,
        authorName: 'カスタム著者名',
      };

      const result = PersonalRssGenerator.generateUserRss(
        mockUser,
        mockPrograms,
        optionsWithAuthorName,
      );

      expect(result.xml).toContain('カスタム著者名');
    });

    it('authorNameが未指定の場合はデフォルト値が使用される', () => {
      const optionsWithoutAuthorName: RssGenerationOptions = {
        ...mockOptions,
        authorName: undefined,
      };

      const result = PersonalRssGenerator.generateUserRss(
        mockUser,
        mockPrograms,
        optionsWithoutAuthorName,
      );

      expect(result.xml).toContain('Tech Post Cast');
    });

    it('プログラム固有の画像URLが優先される', () => {
      const result = PersonalRssGenerator.generateUserRss(mockUser, mockPrograms, mockOptions);

      // program-1は独自の画像URLを持つ
      expect(result.xml).toContain('https://example.com/images/program-1.jpg');
      // program-2は画像URLがないのでデフォルトが使用される
      expect(result.xml).toContain('https://techpostcast.com/images/tech-post-cast-logo.png');
    });
  });

  describe('validateRssGeneration', () => {
    it('正常なデータの場合はエラーが返されない', () => {
      const errors = PersonalRssGenerator.validateRssGeneration(mockUser, mockPrograms);
      expect(errors).toEqual([]);
    });

    it('RSSトークンが未設定の場合はエラーが返される', () => {
      const userWithoutToken: RssUser = {
        ...mockUser,
        rssToken: '',
      };

      const errors = PersonalRssGenerator.validateRssGeneration(userWithoutToken, mockPrograms);
      expect(errors).toContain('RSS token is required');
    });

    it('表示名が未設定の場合はエラーが返される', () => {
      const userWithoutName: RssUser = {
        ...mockUser,
        displayName: '',
      };

      const errors = PersonalRssGenerator.validateRssGeneration(userWithoutName, mockPrograms);
      expect(errors).toContain('User display name is required');
    });

    it('プログラムが空の場合はエラーが返される', () => {
      const errors = PersonalRssGenerator.validateRssGeneration(mockUser, []);
      expect(errors).toContain('At least one program is required');
    });

    it('音声URLが未設定のプログラムがある場合はエラーが返される', () => {
      const programsWithoutAudio: RssProgram[] = [
        {
          ...mockPrograms[0],
          audioUrl: '',
        },
      ];

      const errors = PersonalRssGenerator.validateRssGeneration(mockUser, programsWithoutAudio);
      expect(errors).toContain('Program program-1 is missing audio URL');
    });

    it('音声の長さが無効なプログラムがある場合はエラーが返される', () => {
      const programsWithInvalidDuration: RssProgram[] = [
        {
          ...mockPrograms[0],
          audioDuration: 0,
        },
      ];

      const errors = PersonalRssGenerator.validateRssGeneration(
        mockUser,
        programsWithInvalidDuration,
      );
      expect(errors).toContain('Program program-1 has invalid audio duration');
    });

    it('複数のエラーがある場合は全て返される', () => {
      const invalidUser: RssUser = {
        id: 'user-123',
        displayName: '',
        rssToken: '',
      };

      const invalidPrograms: RssProgram[] = [
        {
          id: 'program-1',
          title: 'テストプログラム',
          audioUrl: '',
          audioDuration: 0,
          createdAt: new Date(),
        },
      ];

      const errors = PersonalRssGenerator.validateRssGeneration(invalidUser, invalidPrograms);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('RSS token is required');
      expect(errors).toContain('User display name is required');
      expect(errors).toContain('Program program-1 is missing audio URL');
      expect(errors).toContain('Program program-1 has invalid audio duration');
    });
  });
});
