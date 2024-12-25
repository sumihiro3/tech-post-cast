import { Request } from 'express';
import { BearerGuardBase } from './bearer-token.guard';

class TestBearerGuard extends BearerGuardBase {
  protected getBearerToken(): string {
    return 'test-token';
  }
}

describe('BearerGuardBase', () => {
  let guard: BearerGuardBase;

  beforeEach(() => {
    guard = new TestBearerGuard();
  });

  describe('getBearerTokenFromRequest', () => {
    it('Bearerトークンが存在する場合、トークンを返すべき', () => {
      const request = {
        headers: {
          authorization: 'Bearer test-token',
        },
      } as Request;

      const token = guard.getBearerTokenFromRequest(request);
      expect(token).toBe('test-token');
    });

    it('authorizationヘッダーが存在しない場合、空文字列を返すべき', () => {
      const request = {
        headers: {},
      } as Request;

      const token = guard.getBearerTokenFromRequest(request);
      expect(token).toBe('');
    });

    it('トークンがBearerで始まらない場合、空文字列を返すべき', () => {
      const request = {
        headers: {
          authorization: 'Basic test-token',
        },
      } as Request;

      const token = guard.getBearerTokenFromRequest(request);
      expect(token).toBe('');
    });

    it('authorizationヘッダーが配列の場合、最初のトークンを返すべき', () => {
      const request = {
        headers: {
          authorization: ['Bearer test-token', 'Bearer another-token'],
        },
      } as unknown as Request;

      const token = guard.getBearerTokenFromRequest(request);
      expect(token).toBe('test-token');
    });
  });
});
