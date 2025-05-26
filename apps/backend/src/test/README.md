# テスト用ユーティリティ

このディレクトリには、テストを効率的に記述するためのユーティリティが含まれています。

## ファクトリー

`factories/` ディレクトリには、テストデータを簡単に作成するためのファクトリークラスが含まれています。

- `app-user.factory.ts` - アプリユーザーのモックデータを作成
- `headline-topic-program.factory.ts` - ヘッドライントピック番組のモックデータを作成
- `listener-letter.factory.ts` - リスナーからのお便りのモックデータを作成
- `personalized-feed.factory.ts` - パーソナライズドフィードのモックデータを作成
- `qiita-post.factory.ts` - Qiita記事のモックデータを作成
- `term.factory.ts` - 用語と読み方のペアのモックデータを作成

## ヘルパー関数

`helpers/` ディレクトリには、テストを簡素化するためのヘルパー関数が含まれています。

- `logger.helper.ts` - テスト実行時のログ出力を制御する関数
- `test-module.helper.ts` - テストモジュールの作成を簡素化する関数

## 使用例

`examples/` ディレクトリには、ファクトリーとヘルパー関数の使用例が含まれています。

- `headline-topic-programs-service.spec.example.ts` - ヘッドライントピック番組サービスのテスト例
- `terms-controller.spec.example.ts` - 用語コントローラーのテスト例

## ログ出力の制御

テスト実行時のログ出力を制御するには、以下の方法があります。

### 1. 環境変数を使用する方法

```txt
TEST_LOG_ENABLED=true yarn test
```

### 2. テストファイル内で明示的に制御する方法

```typescript
import { suppressLogOutput, restoreLogOutput } from '../helpers/logger.helper';

describe('テストスイート', () => {
  let logSpies: jest.SpyInstance[];

  beforeEach(() => {
    logSpies = suppressLogOutput();
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  // テストケース
});
```

## テストモジュールの作成

テストモジュールの作成を簡素化するには、以下のヘルパー関数を使用します。

```typescript
import { createTestingModule, createTestingModuleWithMockPrisma } from '../helpers/test-module.helper';

// 通常のテストモジュールを作成
const module = await createTestingModule({
  controllers: [ExampleController],
  providers: [ExampleService],
});

// PrismaServiceをモック化したテストモジュールを作成
const [module, mockPrisma] = await createTestingModuleWithMockPrisma({
  controllers: [ExampleController],
  providers: [ExampleService],
});
```
