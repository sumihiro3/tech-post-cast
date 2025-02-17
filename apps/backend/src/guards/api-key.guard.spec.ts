import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuardBase } from './api-key.guard';

class TestApiKeyGuard extends ApiKeyGuardBase {
  protected getApiKey(): string {
    return 'test-api-key';
  }
}

describe('ApiKeyGuardBase', () => {
  let guard: TestApiKeyGuard;

  beforeEach(() => {
    guard = new TestApiKeyGuard();
  });

  describe('getApiKeyFromRequest', () => {
    it('リクエストヘッダーからAPIキーを返すべき', () => {
      const request = {
        headers: {
          'x-api-key': 'test-api-key',
        },
      } as any;

      const result = guard['getApiKeyFromRequest'](request);
      expect(result).toBe('test-api-key');
    });

    it('複数のキーが提供された場合、最初のAPIキーを返すべき', () => {
      const request = {
        headers: {
          'x-api-key': ['test-api-key-1', 'test-api-key-2'],
        },
      } as any;

      const result = guard['getApiKeyFromRequest'](request);
      expect(result).toBe('test-api-key-1');
    });

    it('APIキーが存在しない場合はundefinedを返すべき', () => {
      const request = {
        headers: {},
      } as any;

      const result = guard['getApiKeyFromRequest'](request);
      expect(result).toBeUndefined();
    });
  });

  describe('canActivate', () => {
    it('APIキーが有効な場合はtrueを返すべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': 'test-api-key',
            },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('APIキーが無効な場合はUnauthorizedExceptionをスローすべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': 'invalid-api-key',
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('APIキーが存在しない場合はUnauthorizedExceptionをスローすべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('APIキーが単一の有効なキーを含む配列の場合を処理すべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': ['test-api-key'],
            },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('APIキーが複数のキーを含む配列で最初のキーが有効な場合を処理すべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': ['test-api-key', 'another-key'],
            },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('APIキーが複数の無効なキーを含む配列の場合を処理すべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': ['invalid-key-1', 'invalid-key-2'],
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('APIキーが空の配列の場合を処理すべき', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': [],
            },
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
