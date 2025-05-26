# テスト用ユーティリティ

このディレクトリには、テストの効率化と品質向上のためのユーティリティが含まれています。

## ファクトリー

テストデータの作成を簡素化するためのファクトリークラスです。

- `QiitaPostFactory`: Qiita記事関連のモックデータを作成します
- `HeadlineTopicProgramFactory`: ヘッドライントピック番組関連のモックデータを作成します

## ヘルパー

テスト実行をサポートするヘルパー関数です。

- `test-module.helper.ts`: テストモジュールの作成を簡素化します
- `logger.helper.ts`: テスト実行時のログ出力を制御します

## 使用例

`examples` ディレクトリに、これらのユーティリティの使用例があります。

### ログ出力の制御

テスト実行時にログ出力を抑制するには、以下のようにします：

```typescript
import { suppressLogOutput, restoreLogOutput } from '@/test/helpers/logger.helper';

describe('テストスイート', () => {
  let logSpies: jest.SpyInstance[];

  beforeEach(() => {
    // ログ出力を抑制
    logSpies = suppressLogOutput();
  });

  afterEach(() => {
    // ログ出力の抑制を解除
    restoreLogOutput(logSpies);
  });

  // テストケース...
});
```

または、環境変数 `TEST_LOG_ENABLED=true` を設定することで、すべてのテストでログ出力を有効にできます。

### ファクトリーの使用

テストデータの作成を簡素化するには、以下のようにファクトリーを使用します：

```typescript
import { QiitaPostFactory } from '@/test/factories/qiita-post.factory';

// 単一のQiita記事を作成
const post = QiitaPostFactory.createQiitaPost({
  title: 'カスタムタイトル', // 任意のプロパティを上書き
});

// 複数のQiita記事を作成
const posts = QiitaPostFactory.createQiitaPosts(5);

// 検索結果を作成
const searchResult = QiitaPostFactory.createQiitaPostsSearchResult(10, 2, 20, 100);
```

### テストモジュールの作成

テストモジュールの作成を簡素化するには、以下のようにヘルパー関数を使用します：

```typescript
import { createTestingModule, createTestingModuleWithMockPrisma } from '@/test/helpers/test-module.helper';

// 基本的なテストモジュールの作成
const module = await createTestingModule({
  controllers: [MyController],
  providers: [MyService],
});

// PrismaServiceをモック化したテストモジュールの作成
const [module, mockPrismaService] = await createTestingModuleWithMockPrisma({
  providers: [MyRepository],
});
```
