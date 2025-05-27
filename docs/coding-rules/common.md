# Tech Post Cast モノレポ共通実装ルール

**適用対象**: **/*

このプロジェクトはモノレポ構造を採用しており、複数のアプリケーションとパッケージが含まれています。各アプリケーション・パッケージごとに特定のルールが存在する場合は、それらを優先してください。

## 全般的なコーディング規約

- コードの可読性を最優先し、適切なコメントを追加してください。
- 変数名や関数名は意図が明確に伝わるように命名してください。
- 各ファイルは単一の責任を持つようにしてください。
- 可能な限り副作用を避け、純粋な関数を使用してください。
- エラーハンドリングは適切に行い、エラーメッセージは具体的に記述してください。
- マジックナンバーや文字列リテラルを避け、定数として定義してください。
- 循環的依存関係を避けてください。

### 命名規則の統一原則

- **データベーステーブル名とドメインモデル名の一致**: 新機能実装時は、データベーステーブル名とドメインモデル名を一致させる
    - 例: テーブル名が `personalized_program_attempts` の場合、ドメインモデルも `PersonalizedProgramAttempts` とする
    - ビジネス用語とテクニカル用語が異なる場合は、プロジェクト開始時に統一ルールを決定する
- **実装前の命名規則確認**: 新機能実装開始前に、既存の類似機能の命名パターンを調査し、一貫性を保つ
- **途中での命名変更コスト**: 命名の不整合が発見された場合は、早期に統一することでリファクタリングコストを最小化する

### プロジェクト一貫性の確保

- **既存パターン調査の義務化**: 新機能実装前に、類似機能の実装パターンを必ず調査する
    - インターフェイス使用の有無
    - エラーハンドリングパターン
    - テストデータ管理方法
    - ディレクトリ構造
- **設計判断の記録**: 既存パターンと異なる実装を行う場合は、その理由を明確に記録する
- **一貫性レビュー**: コードレビュー時に、プロジェクト全体の一貫性を確認する項目を含める

## ディレクトリ構造

```txt
tech-post-cast/
├── apps/                # アプリケーション
│   ├── api-backend/     # バックエンドAPI (NestJS)
│   ├── backend/         # 番組生成用バックエンドAPI (NestJS)
│   ├── lp-frontend/     # ランディングページフロントエンド (Nuxt3)
│   ├── liff-frontend/   # LIFFフロントエンド
│   ├── line-bot/        # LINEボット
│   └── infra/           # インフラストラクチャコード (AWS CDK)
├── packages/            # 共有パッケージ
│   ├── database/        # データベース関連コード・スキーマ
│   └── commons/         # 共通ユーティリティと機能
└── docs/                # プロジェクトドキュメント
```

## Git管理

- コミットメッセージは具体的に記述し、関連するチケット番号を含めてください。
- ブランチ名は `feature/XXX`、`fix/XXX`、`refactor/XXX` などの命名規則にしたがってください。
- 機能開発はfeatureブランチで行い、完成したらPull Requestを作成してください。
- コードレビュープロセスを経てからマージしてください。

## テスト

- 新しい機能を追加する場合は、対応するテストも追加してください。
- テストカバレッジを維持するように努めてください。
- テストは自動化され、CI/CDパイプラインに組み込まれています。

## 統一テスト戦略

すべてのアプリケーションに適用される共通のテスト戦略を以下に定義します。各アプリケーション種別固有のテスト実装の詳細は、それぞれのガイドラインドキュメントを参照してください。

### テストの種類と目的

1. **単体テスト (Unit Tests)**
   - 個々の関数、メソッド、コンポーネントを分離してテスト
   - 外部依存性はモック/スタブする
   - 開発者が機能を実装する際に作成
   - 目標カバレッジ: 80%以上（ロジックを含むコード）

2. **統合テスト (Integration Tests)**
   - 複数のコンポーネントやサービスの連携をテスト
   - 実際の依存関係を使用するが、外部システム（データベース、APIなど）はモック化
   - 機能単位で実装
   - 目標カバレッジ: 重要な統合ポイントを網羅

3. **E2Eテスト (End-to-End Tests)**
   - ユーザーフロー全体をシミュレート
   - 実際の環境に近い状態でテスト
   - 主要なユーザーストーリーに対して実装
   - 目標: 主要なユーザーフローをカバー

### テスト命名規則

- テストファイル名は対象ファイル名に `.spec.ts` または `.test.ts` を付加
    - 例: `user.service.ts` → `user.service.spec.ts`
- テストケース名は機能と期待される結果を明確に表現
    - 形式: `should [期待される結果] when [条件]`
    - 例: `should return user object when valid ID is provided`

### テスト構造

- **単体テスト・統合テスト**: Arrange-Act-Assert パターンを使用

  ```typescript
  it('should calculate correct tax amount when given a price', () => {
    // Arrange
    const price = 100;
    const taxRate = 0.1;
    const expectedTax = 10;

    // Act
    const actualTax = calculateTax(price, taxRate);

    // Assert
    expect(actualTax).toBe(expectedTax);
  });
  ```

- **E2Eテスト**: Given-When-Then パターンを使用

  ```typescript
  describe('User login', () => {
    it('should allow access to dashboard when credentials are valid', async () => {
      // Given
      const validCredentials = { email: 'user@example.com', password: 'password123' };

      // When
      await loginPage.navigate();
      await loginPage.login(validCredentials);

      // Then
      expect(await dashboardPage.isVisible()).toBe(true);
    });
  });
  ```

### テストデータ管理

- テストデータは各テストケース内でセットアップ
- 共通のテストデータはファクトリ関数またはフィクスチャとして実装
- 機密データをテストに含めない
- テスト間の独立性を確保するため、各テスト前に状態をリセット

### モック・スタブの使用

- 外部依存性は必ずモック化またはスタブ化
- テスト対象の隣接コンポーネントもモック化することを推奨
- 一貫性のあるモックを作成するために、モックファクトリを使用

  ```typescript
  // モックファクトリの例
  export const createUserServiceMock = () => ({
    findById: jest.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
    create: jest.fn().mockImplementation((data) => ({ id: '1', ...data })),
    update: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
  });
  ```

### テストカバレッジ

- CI/CDパイプラインでテストカバレッジレポートを生成
- 以下のカバレッジ目標を設定：
    - ステートメントカバレッジ: 80%以上
    - ブランチカバレッジ: 75%以上
    - 関数カバレッジ: 90%以上
- 新機能の追加や既存機能の変更時にはカバレッジを維持または向上させる
- 重要なビジネスロジックは100%のカバレッジを目指す

### テスト環境の設定

- `.env.test` ファイルを使用してテスト環境変数を管理
- テスト環境ではモックサーバーを使用して外部依存性をシミュレート
- インメモリデータベースを使用してデータベーステストを高速化
- CI環境では並列テスト実行を活用して実行時間を短縮

### テスト実行

- 開発中: 変更に関連するテストのみ実行

  ```bash
  # 特定のファイルのテストを実行
  yarn test:watch -- user.service
  ```

- コミット前: 影響範囲のテストを実行
- CI/CD: すべてのテストを実行

  ```bash
  # すべてのテストを実行
  yarn test
  ```

### バグ修正と回帰テスト

- バグ修正時は必ず回帰テストを追加
- バグ再現のテストケースを先に作成し、修正後にテストが通ることを確認
- 類似のバグが他の場所で発生していないか確認するためのテストも検討

### パフォーマンステスト

- 重要なAPIエンドポイントに対してはパフォーマンステストを実施
- レスポンスタイムの閾値を設定し、CI/CDパイプラインで検証
- 大量データ処理時の挙動をテスト

### アプリケーション種別ごとのテスト戦略

各アプリケーション種別に対する具体的なテスト実装方法は、以下のドキュメントを参照してください：

- [NestJSバックエンドテスト戦略](/docs/coding-rules/api-backend.md#テスト)
- [Nuxt 3フロントエンドテスト戦略](/docs/coding-rules/lp-frontend.md#テスト)
- [LINE Botテスト戦略](/docs/coding-rules/line-bot.md#テスト)
- [インフラストラクチャテスト戦略](/docs/coding-rules/infra.md#テスト)

## パッケージ管理

- 依存関係の管理にはYarnを使用しています。
- ルートの package.json にはモノレポ全体の依存関係を記述し、各アプリケーションの package.json にはそのアプリケーション固有の依存関係を記述してください。
- バージョン競合を避けるため、共通ライブラリはルートの package.json で管理してください。

## ドキュメント

- コードの変更を行う場合は、必要に応じてドキュメントも更新してください。
- APIエンドポイントを追加・変更する場合は、OpenAPI仕様を更新してください。
- 新しい機能や重要な変更については、docs/ ディレクトリにドキュメントを追加してください。

## 環境設定

- 環境変数は `.env` ファイルで管理し、機密情報は含めないでください。
- 開発環境と本番環境の違いは環境変数で制御してください。
- CI/CD設定は `.github/workflows/` ディレクトリにあります。

## 共有コードとパッケージの使用ガイドライン

### packages/commons パッケージ

`commons`パッケージは、複数のアプリケーション間で共有されるユーティリティ関数やミドルウェアなどの基本的な機能を提供します。

#### 利用方法

- アプリケーションの`package.json`で`commons`パッケージを依存関係として追加してください。

  ```json
  "dependencies": {
    "@tech-post-cast/commons": "*"
  }
  ```

- 特定の機能のみをインポートし、不要な依存関係を避けてください。

  ```typescript
  // 良い例: 必要な機能だけをインポート
  import { formatDate } from '@tech-post-cast/commons';

  // 避けるべき例: 全体をインポート
  import * as commons from '@tech-post-cast/commons';
  ```

#### 拡張方法

- `commons`パッケージに新機能を追加する際は、以下の基準を考慮してください：
  1. 複数のアプリケーションで必要となる汎用的な機能であること
  2. アプリケーション固有のロジックを含まないこと
  3. 単一責任の原則にしたがっていること
- 新しいユーティリティ関数を追加する場合、適切なテストを作成してください。
- バックワードコンパティビリティを維持し、破壊的変更は避けてください。

### packages/database パッケージ

`database`パッケージは、Prismaスキーマ定義とデータベースアクセスのための共通機能を提供します。

#### 利用方法

- アプリケーションの`package.json`で`database`パッケージを依存関係として追加してください。

  ```json
  "dependencies": {
    "@tech-post-cast/database": "*"
  }
  ```

- データベースアクセスには必ず`PrismaClientManager`を使用してください。

  ```typescript
  import { PrismaClientManager } from '@tech-post-cast/database';

  @Injectable()
  export class UserService {
    constructor(private prismaClientManager: PrismaClientManager) {}

    async findUser(id: string) {
      return this.prismaClientManager.client.user.findUnique({
        where: { id }
      });
    }
  }
  ```

#### データモデルの拡張方法

- 新しいデータモデルを追加するには、`database/prisma/schema.prisma`を修正してください。
- モデル変更後は、以下の手順にしたがってください：
  1. マイグレーションスクリプトを生成: `yarn workspace @tech-post-cast/database prisma migrate dev --name <変更内容>`
  2. 型定義を更新: `yarn workspace @tech-post-cast/database prisma generate`
  3. テストを実行して変更の影響を確認
- モデル変更の前にはチームメンバーと協議し、変更の影響範囲を確認してください。

### 共有コード使用の一般原則

- 共有コードとアプリケーション固有のコードの間に明確な境界を設けてください。
- 循環依存を避けるため、共有パッケージは他の共有パッケージやアプリケーションに依存しないようにしてください。
- アプリケーション固有のロジックは共有パッケージに移動せず、適切なアプリケーションモジュール内に保持してください。
- 共有コードに変更を加える際は、すべての依存アプリケーションへの影響を考慮してください。
- 共有パッケージのAPIに破壊的変更を加える場合は、移行計画を立て、チームに通知してください。

### データベーススキーマ変更時の影響管理

#### 変更前チェックリスト

データベーススキーマを変更する際は、以下の影響範囲を必ず確認する：

1. **全アプリケーションのファクトリクラス**
   - `apps/api-backend/src/test/factories/`
   - `apps/backend/src/test/factories/`
   - 新フィールド追加時のデフォルト値設定

2. **型定義ファイル**
   - `packages/database/` の型定義
   - 各アプリケーションの custom.d.ts

3. **既存テストへの影響**
   - スキーマ変更によるテスト失敗の確認
   - 必要に応じたテストデータ更新

#### 変更後の確認手順

1. **全アプリケーションでのテスト実行**

   ```bash
   yarn workspace @tech-post-cast/api-backend test
   yarn workspace @tech-post-cast/backend test
   ```

2. **ビルド確認**

   ```bash
   yarn build
   ```

3. **型定義の整合性確認**
   - TypeScript コンパイルエラーの解消
   - OpenAPI 仕様生成の確認

## 事前設計レビュープロセス

### 新機能実装前のチェックリスト

実装開始前に以下の項目を必ず確認し、チームでレビューを実施する：

1. **データベース設計の整合性**
   - テーブル名とドメインモデル名の一致
   - 既存テーブルとの関連性
   - マイグレーション戦略

2. **既存パターンとの一貫性**
   - 類似機能の実装パターン調査
   - アーキテクチャパターンの統一
   - エラーハンドリング方式の統一

3. **命名規則の確認**
   - ディレクトリ構造
   - クラス名・メソッド名
   - API エンドポイント名

4. **テスト戦略の確認**
   - ファクトリクラスの設計
   - テストカバレッジ計画
   - モック戦略

### レビュー実施タイミング

- Phase 1 実装前: データベース設計とドメインモデル設計
- Phase 2 実装前: アーキテクチャパターンとAPI設計
- 実装完了後: 最終的な一貫性確認

## 段階的実装アプローチ

### 推奨実装フェーズ

大規模な機能実装時は以下のフェーズに分割して実装する：

1. **Phase 1: データアクセス層**
   - Repository インターフェイスと実装
   - エラークラス定義
   - Repository テスト

2. **Phase 2: ビジネスロジック層**
   - Service クラス実装
   - ビジネスルール実装
   - Service テスト

3. **Phase 3: コントローラー層**
   - DTO クラス定義
   - エンドポイント実装
   - Controller テスト

4. **Phase 4: 影響調査と対応**
   - 他アプリケーションへの影響確認
   - 必要に応じた修正

5. **Phase 5: ドキュメントと統合**
   - API ドキュメント作成
   - Rest Client ファイル作成
   - 最終テスト実行

### フェーズ間の確認事項

- 各フェーズ完了時にテストがすべて成功することを確認
- 次フェーズ開始前に設計レビューを実施
- 問題発見時は早期に前フェーズに戻って修正

## Rest Client実装ガイドライン

### ファイル構成と配置

- **配置場所**: プロジェクトルート直下の `rest-client/` ディレクトリ
- **ディレクトリ構造**:

  ```
  rest-client/
  ├── api-backend/
  │   ├── {domain}.http
  │   └── auth.http
  ├── backend/
  │   └── {domain}.http
  └── .env
  ```

### Rest Clientファイルの標準フォーマット

```http
### 変数定義
@baseUrl = {{$dotenv API_BASE_URL}}
@authToken = {{$dotenv JWT_TOKEN}}

### {機能名} - 正常系
GET {{baseUrl}}/api/endpoint
Authorization: Bearer {{authToken}}
Content-Type: application/json

### {機能名} - ページネーション
GET {{baseUrl}}/api/endpoint?limit=10&offset=0
Authorization: Bearer {{authToken}}
Content-Type: application/json

### {機能名} - エラーケース: 認証なし
GET {{baseUrl}}/api/endpoint
Content-Type: application/json

### 期待レスポンス例
# {
#   "data": [...],
#   "totalCount": 100,
#   "hasNext": true
# }
```

### 必須テストケース

各APIエンドポイントに対して以下のテストケースを必ず含める：

1. **正常系**: 基本的な成功ケース
2. **ページネーション**: limit/offset パラメーター付き
3. **認証エラー**: Authorization ヘッダーなし
4. **バリデーションエラー**: 不正なパラメーター
5. **権限エラー**: 他ユーザーのリソースアクセス

### 環境変数管理

- `.env` ファイルで環境依存の値を管理
- 機密情報（JWT トークン等）は `.env.example` に記載せず、個別設定
