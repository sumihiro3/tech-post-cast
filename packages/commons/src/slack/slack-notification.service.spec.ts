import { SlackNotificationService } from './slack-notification.service';

// fetchをモック化
global.fetch = jest.fn();

describe('SlackNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const lpBaseUrl = 'https://techpostcast.com';
  const audioFileBaseUrl = 'https://program-files.techpostcast.com';

  describe('sendNotification', () => {
    it('正常にSlack通知を送信できること', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const webhookUrl = 'https://hooks.slack.com/test';
      const message = {
        username: 'Test Bot',
        text: 'Test message',
      };

      // Act
      const result = await SlackNotificationService.sendNotification(webhookUrl, message);

      // Assert
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    });

    it('Slack API エラー時に適切にエラーを処理すること', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const webhookUrl = 'https://hooks.slack.com/test';
      const message = { text: 'Test message' };

      // Act
      const result = await SlackNotificationService.sendNotification(webhookUrl, message);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Slack API エラー: 400 Bad Request');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('ネットワークエラー時に適切にエラーを処理すること', async () => {
      // Arrange
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const webhookUrl = 'https://hooks.slack.com/test';
      const message = { text: 'Test message' };

      // Act
      const result = await SlackNotificationService.sendNotification(webhookUrl, message);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildPersonalProgramNotificationMessage', () => {
    it('成功したプログラムがある場合、リッチなメッセージを構築すること', () => {
      // Arrange
      const userData = {
        displayName: 'テストユーザー',
        attempts: [
          {
            feedName: 'TypeScript記事',
            status: 'SUCCESS',
            reason: null,
            postCount: 5,
            program: {
              id: 'program123',
              title: 'TypeScript最新情報',
              audioUrl: 'https://example.com/audio.mp3',
            },
          },
        ],
      };

      // Act
      const message = SlackNotificationService.buildPersonalProgramNotificationMessage(
        userData,
        lpBaseUrl,
        audioFileBaseUrl,
      );

      // Assert
      expect(message.username).toBe('TechPostCast 通知');
      expect(message.icon_emoji).toBe(':microphone:');
      expect(message.blocks).toBeDefined();
      expect(message.blocks!.length).toBeGreaterThan(0);

      // ヘッダーブロックの確認
      const headerBlock = message.blocks![0];
      expect(headerBlock.type).toBe('section');
      expect(headerBlock.text.text).toContain('テストユーザー');
      expect(headerBlock.text.text).toContain('パーソナルプログラムの配信結果');

      // サマリーブロックの確認
      const summaryBlock = message.blocks![1];
      expect(summaryBlock.type).toBe('section');
      expect(summaryBlock.fields).toBeDefined();
      expect(summaryBlock.fields.length).toBe(4);

      // 成功プログラムブロックの確認
      const programBlocks = message.blocks!.filter(
        (block) =>
          block.type === 'section' && block.text && block.text.text.includes('TypeScript記事'),
      );
      expect(programBlocks.length).toBe(1);

      const programBlock = programBlocks[0];
      expect(programBlock.text.text).toContain('新しい番組が生成されました');
      expect(programBlock.text.text).toContain('TypeScript最新情報');
      expect(programBlock.text.text).toContain('音声を聞く');
      expect(programBlock.text.text).toContain('番組詳細');
      expect(programBlock.accessory).toBeDefined();
      expect(programBlock.accessory.type).toBe('image');
    });

    it('失敗したプログラムがある場合、シンプルなメッセージを構築すること', () => {
      // Arrange
      const userData = {
        displayName: 'テストユーザー',
        attempts: [
          {
            feedName: 'JavaScript記事',
            status: 'FAILED',
            reason: 'API制限に達しました',
            postCount: 0,
            program: null,
          },
        ],
      };

      // Act
      const message = SlackNotificationService.buildPersonalProgramNotificationMessage(
        userData,
        lpBaseUrl,
        audioFileBaseUrl,
      );

      // Assert
      expect(message.blocks).toBeDefined();

      // 失敗ブロックの確認
      const failedBlocks = message.blocks!.filter(
        (block) =>
          block.type === 'section' && block.text && block.text.text.includes('JavaScript記事'),
      );
      expect(failedBlocks.length).toBe(1);

      const failedBlock = failedBlocks[0];
      expect(failedBlock.text.text).toContain('❌');
      expect(failedBlock.text.text).toContain('番組生成失敗');
      expect(failedBlock.text.text).toContain('API制限に達しました');
      expect(failedBlock.accessory).toBeUndefined();
    });

    it('複数のフィードがある場合、適切にメッセージを構築すること', () => {
      // Arrange
      const userData = {
        displayName: 'テストユーザー',
        attempts: [
          {
            feedName: 'TypeScript記事',
            status: 'SUCCESS',
            reason: null,
            postCount: 3,
            program: {
              id: 'program1',
              title: 'TypeScript入門',
              audioUrl: 'https://example.com/audio1.mp3',
            },
          },
          {
            feedName: 'React記事',
            status: 'SKIPPED',
            reason: '新しい記事がありません',
            postCount: 0,
            program: null,
          },
        ],
      };

      // Act
      const message = SlackNotificationService.buildPersonalProgramNotificationMessage(
        userData,
        lpBaseUrl,
        audioFileBaseUrl,
      );

      // Assert
      expect(message.blocks).toBeDefined();

      // サマリーブロックの確認
      const summaryBlock = message.blocks![1];
      expect(summaryBlock.fields[0].text).toContain('*成功:* 1件');
      expect(summaryBlock.fields[1].text).toContain('*スキップ:* 1件');
      expect(summaryBlock.fields[2].text).toContain('*失敗:* 0件');
      expect(summaryBlock.fields[3].text).toContain('*合計:* 2件');

      // 成功した番組がある場合のサイト誘導メッセージの確認
      const sitePromotionBlocks = message.blocks!.filter(
        (block) =>
          block.type === 'section' && block.text && block.text.text.includes('TechPostCast サイト'),
      );
      expect(sitePromotionBlocks.length).toBe(1);
    });

    it('成功した番組がない場合、サイト誘導メッセージを表示しないこと', () => {
      // Arrange
      const userData = {
        displayName: 'テストユーザー',
        attempts: [
          {
            feedName: 'JavaScript記事',
            status: 'FAILED',
            reason: 'エラーが発生しました',
            postCount: 0,
            program: null,
          },
        ],
      };

      // Act
      const message = SlackNotificationService.buildPersonalProgramNotificationMessage(
        userData,
        lpBaseUrl,
        audioFileBaseUrl,
      );

      // Assert
      const sitePromotionBlocks = message.blocks!.filter(
        (block) =>
          block.type === 'section' && block.text && block.text.text.includes('TechPostCast サイト'),
      );
      expect(sitePromotionBlocks.length).toBe(0);
    });
  });

  describe('maskWebhookUrl', () => {
    it('正常なWebhook URLをマスクできること', () => {
      // Arrange
      const webhookUrl = 'https://hooks.slack.com/services/T123/B456/secrettoken';

      // Act
      const maskedUrl = SlackNotificationService.maskWebhookUrl(webhookUrl);

      // Assert
      expect(maskedUrl).toBe('https://hooks.slack.com/services/T123/B456/***');
    });

    it('不正なURLの場合、マスクされた文字列を返すこと', () => {
      // Arrange
      const invalidUrl = 'invalid-url';

      // Act
      const maskedUrl = SlackNotificationService.maskWebhookUrl(invalidUrl);

      // Assert
      expect(maskedUrl).toBe('***');
    });
  });

  describe('getTimeBasedGreeting (private method test via message)', () => {
    it('時間帯に応じた挨拶がメッセージに含まれること', () => {
      // Arrange
      const userData = {
        displayName: 'テストユーザー',
        attempts: [],
      };

      // Act
      const message = SlackNotificationService.buildPersonalProgramNotificationMessage(
        userData,
        lpBaseUrl,
        audioFileBaseUrl,
      );

      // Assert
      const headerBlock = message.blocks![0];
      const greetings = [
        '🌅 おはようございます',
        '☀️ こんにちは',
        '🌆 こんばんは',
        '🌙 お疲れさまです',
      ];
      const hasGreeting = greetings.some((greeting) => headerBlock.text.text.includes(greeting));
      expect(hasGreeting).toBe(true);
    });
  });
});
