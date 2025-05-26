# コーディングガイドライン

このドキュメントではTech Post Castプロジェクトでのコーディングルールについて説明します。より詳細なルールは`/docs/coding-rules/`ディレクトリに保存されています。

## 全般的なルール

- TypeScriptの厳格モード (`strict: true`) を使用する
- すべての関数には適切な戻り値の型を指定する
- any型の使用は避け、明示的な型定義を行う
- 適切なエラーハンドリングを常に実装する
- コードの可読性を最優先し、適切なコメントを追加する
- 変数名や関数名は意図が明確に伝わるように命名する
- 各ファイルは単一の責任を持つようにする

## アプリケーション固有のルール

各アプリケーションは専用のガイドラインにしたがってください。詳細なルールは以下のファイルを参照してください：

- [共通ルール](/docs/coding-rules/common.md) - すべてのアプリケーションに適用される基本ルール
- [NestJSバックエンドルール](/docs/coding-rules/api-backend.md) - API BackendとBackendアプリケーション用のルール
- [Nuxt 3フロントエンドルール](/docs/coding-rules/lp-frontend.md) - LPフロントエンドとLIFF用のルール
- [LINE Botルール](/docs/coding-rules/line-bot.md) - LINE Bot用のルール
- [インフラルール](/docs/coding-rules/infra.md) - インフラストラクチャコード用のルール

各アプリケーションディレクトリにはそれぞれのREADME.mdファイルがあり、そのアプリケーション固有の情報やガイドラインを提供しています。

## NestJSアプリケーション

### アーキテクチャ

NestJSアプリケーションは以下の層に分けて実装します：

1. **Controllers**: APIエンドポイントを定義し、クライアントからのリクエストを処理
2. **DTOs**: データ転送オブジェクト、リクエストとレスポンスの構造を定義
3. **Services**: ビジネスロジックを実装
4. **Repositories**: データアクセス層、データベースとの連携
5. **Entities**: データモデルの定義

### コントローラー

- リクエストパラメーターはDTOクラスにまとめる
- DTOには `class-validator` と `class-transformer` を使用してバリデーションを追加する
- OpenAPI定義のために `@nestjs/swagger` のデコレーターを使用する
- ルートハンドラーでは try-catch ブロックを使用してエラーハンドリングを行う
- ルートごとに1つのコントローラーを作成し、関連する機能をグループ化する

### DTOクラス

- プロパティごとに `@ApiProperty` デコレーターを追加する
- プロパティには適切なバリデーションルールを設定する
- 型変換が必要な場合は `@Transform` デコレーターを使用する
- リクエストDTOとレスポンスDTOを明確に分ける

### サービス

- 単一責任の原則に従い、明確な役割を持つサービスを実装する
- 依存性の注入を活用して、コンポーネント間の結合度を低くする
- トランザクション処理はビジネスロジックの一部としてServiceクラスで実装する
- プライベートメソッドを使用して、共通ロジックをカプセル化する

## Nuxt 3アプリケーション

### コンポーネント設計

- ファイル名はPascalCaseで命名する (例: TopHero.vue)
- コンポーネントはTypeScriptのSetup Scriptで実装する
- Propsや出力値の型は明示的に定義する
- 大きなコンポーネントは適切に分割する

### 状態管理

- ページレベルの状態はページコンポーネント内で管理する
- 複数のコンポーネント間で共有する状態はcomposablesに切り出す
- 環境変数はruntimeConfigを介してアクセスする

## テスト

- すべての機能には単体テストを作成する
- 外部依存性は適切にモック化する
- テストケースは機能の正常系と異常系の両方をカバーする
- NestJSのテストはArrange-Act-Assert規約に従う
- Nuxtのテストはコンポーネントのロジックをcomposablesに分離してテスト可能にする
- テストユーティリティ（ファクトリー、ログ制御、ヘルパー関数）を活用してテストコードの品質と効率を向上させる

## コメント

- 複雑なロジックには説明コメントを追加する
- パブリックAPIには JSDoc スタイルのコメントを使用する
- TODO コメントには担当者と期限を含める

## テストユーティリティ

このプロジェクトでは、テストの効率化と品質向上のために共通のテストユーティリティを提供しています。

### テストデータファクトリー

各アプリケーションには、モックデータを簡単に作成するためのファクトリークラスが用意されています：

- `apps/api-backend/src/test/factories/` - API Backend用ファクトリー
- `apps/backend/src/test/factories/` - Backend用ファクトリー

**使用例:**
```typescript
import { QiitaPostFactory } from '@/test/factories/qiita-post.factory';

// 単一のモックデータを作成
const post = QiitaPostFactory.createQiitaPost({
  title: 'カスタムタイトル', // 任意のプロパティを上書き
});

// 複数のモックデータを作成
const posts = QiitaPostFactory.createQiitaPosts(5);
```

### ログ出力制御

テスト実行時のログ出力を制御するための機能を提供しています：

**環境変数による制御:**
```bash
# ログ出力を有効化（デバッグ時）
TEST_LOG_ENABLED=true yarn test
```

**プログラムによる制御:**
```typescript
import { suppressLogOutput, restoreLogOutput } from '@/test/helpers/logger.helper';

describe('テストスイート', () => {
  let logSpies: jest.SpyInstance[];

  beforeEach(() => {
    logSpies = suppressLogOutput();
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });
});
```

### テストモジュールヘルパー

NestJSテストモジュールの作成を簡素化するためのヘルパー関数を提供しています：

```typescript
import { createTestingModule, createTestingModuleWithMockPrisma } from '@/test/helpers/test-module.helper';

// 基本的なテストモジュール
const module = await createTestingModule({
  controllers: [MyController],
  providers: [MyService],
});

// PrismaServiceをモック化したテストモジュール
const [module, mockPrisma] = await createTestingModuleWithMockPrisma({
  providers: [MyRepository],
});
```

詳細な使用方法については、各アプリケーションの `src/test/README.md` を参照してください。

## Git管理のベストプラクティス

- コミットメッセージは具体的に記述し、関連するチケット番号を含める
- ブランチ名は `feature/XXX`、`fix/XXX`、`refactor/XXX` などの命名規則に従う
- 機能開発はfeatureブランチで行い、完成したらPull Requestを作成する
- コードレビュープロセスを経てからマージする

## ツールとリンター

- ESLintを使用してコードの品質を維持する
- Prettierでコードフォーマットを統一する
- TypeScriptのコンパイラオプションは厳格なルールを適用する
- コミット前に必ずlintチェックとテストを実行する

## 詳細な規約

より詳細なコーディング規約については、[/docs/coding-rules/](/docs/coding-rules/)ディレクトリのドキュメントを参照してください。新しいアプリケーションやパッケージを追加する場合は、既存のルールを拡張し、必要に応じて新しいガイドラインドキュメントを作成してください。
