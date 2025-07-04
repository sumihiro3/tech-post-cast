# NestJSバックエンド実装ルール

**適用対象**: apps/api-backend/**/*

あなたは、NestJSフレームワークの経験があり、クリーンなプログラミングとデザインパターンを重視するシニアTypeScriptプログラマーです。

基本的な原則と命名規則に準拠したコード、修正、リファクタリングを生成してください。

## TypeScript一般ガイドライン

### 基本原則

- すべてのコードは英語で記述します。
- すべてのコメント・ドキュメントは日本語で記述します。
- 各変数と関数（パラメーターと戻り値）の型を必ず宣言します。
    - `any`型の使用を避けます。
    - 必要な型を作成します。
- パブリッククラスとメソッドにはJSDocでドキュメントを記述します。
- 関数内に空行を残さないようにします。
- 1ファイルにつき1つのエクスポートにします。

### 命名規則

- クラスにはPascalCaseを使用します。
- 変数、関数、メソッドにはcamelCaseを使用します。
- ファイル名とディレクトリ名にはkebab-caseを使用します。
- 環境変数にはUPPERCASEを使用します。
    - マジックナンバーを避け、定数を定義します。
- 各関数は動詞で始めます。
- ブール値の変数には動詞を使用します。例：isLoading、hasError、canDeleteなど。
- 略語を避け、完全な単語と正しいスペルを使用します。
    - API、URLなどの標準的な略語は除きます。
    - よく知られた略語は除きます：
        - ループのi、j
        - エラーのerr
        - コンテキストのctx
        - ミドルウェア関数パラメーターのreq、res、next

### 関数

- この文脈では、関数として理解されるものはメソッドにも適用されます。
- 単一の目的を持つ短い関数を書きます。20行未満にします。
- 関数名は動詞と他の要素で構成します。
    - ブール値を返す場合は、isX、hasX、canXなどを使用します。
    - 何も返さない場合は、executeX、saveXなどを使用します。
- ブロックのネストを避けます：
    - 早期チェックとリターンを使用します。
    - ユーティリティ関数に抽出します。
- 関数のネストを避けるために高次関数（map、filter、reduceなど）を使用します。
    - シンプルな関数（3行未満）にはアロー関数を使用します。
    - 複雑な関数には名前付き関数を使用します。
- nullやundefinedのチェックの代わりにデフォルトパラメーター値を使用します。
- RO-ROを使用して関数パラメーターを減らします
    - 複数のパラメーターを渡すにはオブジェクトを使用します。
    - 結果を返すにはオブジェクトを使用します。
    - 入力引数と出力に必要な型を宣言します。
- 単一レベルの抽象化を使用します。

### データ

- プリミティブ型の乱用を避け、複合型でデータをカプセル化します。
- 関数内でのデータバリデーションを避け、内部バリデーションを持つクラスを使用します。
- データの不変性を優先します。
    - 変更されないデータにはreadonlyを使用します。
    - 変更されないリテラルにはas constを使用します。

### クラス

- SOLID原則に従います。
- 継承よりもコンポジションを優先します。
- インターフェイスを宣言して契約を定義します。
- 単一の目的を持つ小さなクラスを書きます。
    - 200行未満にします。
    - パブリックメソッドは10個未満にします。
    - プロパティは10個未満にします。

### 例外処理

- 予期しないエラーを処理するために例外を使用します。
- 例外をキャッチする場合は、以下のいずれかの目的であるべきです：
    - 予期された問題を修正する
    - コンテキストを追加する
    - それ以外の場合は、グローバルハンドラーを使用する

### テスト

#### 基本原則

- テストにはArrange-Act-Assert規約に従います。
- テスト変数には明確な名前を付けます。
    - 規約に従います：inputX、mockX、actualX、expectedXなど。
- 各パブリック関数のユニットテストを書きます。
    - 依存関係をシミュレートするためにテストダブルを使用します。
        - 実行コストが高くないサードパーティ依存関係は除きます。
- 各モジュールの受け入れテストを書きます。
    - Given-When-Then規約に従います。

#### テストデータ管理（必須）

- **ファクトリクラスの使用**: テストデータは必ずファクトリクラスから取得する
    - 場所: `src/test/factories/{domain-name}.factory.ts`
    - 命名規則: `{DomainName}Factory`
    - インデックスファイル: `src/test/factories/index.ts` でエクスポート管理

```typescript
// src/test/factories/user.factory.ts
export class UserFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-1',
      email: 'test@example.com',
      name: 'テストユーザー',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      ...overrides,
    };
  }

  static createUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.createUser({
        id: `user-${index + 1}`,
        email: `test${index + 1}@example.com`,
        ...overrides,
      }),
    );
  }
}
```

```typescript
// テストでの使用例
import { UserFactory } from '@/test/factories';

describe('UserService', () => {
  it('should create user successfully', () => {
    // Arrange
    const userData = UserFactory.createUser({
      email: 'custom@example.com',
    });

    // Act & Assert
    // ...
  });
});
```

#### ファクトリクラス設計のベストプラクティス

- **基本メソッドの提供**: 各ドメインに対して以下のメソッドを必ず実装する

  ```typescript
  // 基本作成メソッド
  static create{DomainName}(overrides?: Partial<{DomainName}>): {DomainName}

  // 複数作成メソッド
  static create{DomainName}s(count: number, overrides?: Partial<{DomainName}>): {DomainName}[]

  // 特化メソッド（必要に応じて）
  static create{SpecificCase}{DomainName}s(): {DomainName}[]
  ```

- **特化ファクトリメソッドの命名規則**:
    - ステータス別: `createActiveUsers()`, `createInactiveUsers()`
    - 時系列データ: `createTimeSeriesData()`
    - 複合データ: `createMixedStatusData()`

- **ファクトリメソッドの責任範囲**:
    - テストに必要な最小限のデータ作成
    - リアルなデータ構造の模倣
    - テスト間の独立性確保

#### ファクトリクラス使用の強制

- **必須使用**: すべてのテストでファクトリクラスからテストデータを取得する
- **直接記載禁止**: テストコード内でのオブジェクトリテラル直接記載を禁止
- **例外**: プリミティブ型の単純な値（文字列、数値）は直接記載可能

#### Repositoryテストの実装

- Repositoryクラスのテストでは、PrismaServiceをモック化する
- ファクトリクラスを使用してテストデータを作成する
- エラーケースも必ずテストする

```typescript
// src/infrastructure/database/users/users.repository.spec.ts
import { UsersRepository } from './users.repository';
import { UserFactory } from '@/test/factories';
import { createTestingModuleWithMockPrisma } from '@/test/helpers';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockPrisma: any;

  beforeEach(async () => {
    const [module, prisma] = await createTestingModuleWithMockPrisma({
      providers: [UsersRepository],
    });

    repository = module.get<UsersRepository>(UsersRepository);
    mockPrisma = prisma;
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const expectedUser = UserFactory.createUser();
      mockPrisma.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.findById('user-1');

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { posts: true },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### Repository インターフェイス分離の原則（必須）

Repository パターンでは必ずインターフェイスを定義し、依存性逆転の原則を適用してください：

```typescript
// ドメイン層インターフェイス
// src/domains/{domain-name}/{domain-name}.repository.interface.ts
export interface I{DomainName}Repository {
  findByUserId(userId: string, options: PaginationOptions): Promise<PaginatedResult>;
  findById(id: string): Promise<{DomainName}WithDetails | null>;
}

// インフラ層実装
// src/infrastructure/database/{domain-name}/{domain-name}.repository.ts
@Injectable()
export class {DomainName}Repository implements I{DomainName}Repository {
  // 実装
}

// DI設定
providers: [
  {
    provide: '{DomainName}Repository',
    useClass: {DomainName}Repository,
  },
]
```

#### 設計理由

1. **クリーンアーキテクチャの維持**: ドメイン層がインフラ層に依存しない設計
2. **テスタビリティの向上**: モックオブジェクトの作成が容易
3. **将来の拡張性**: データアクセス層の実装変更が容易
4. **一貫性の確保**: プロジェクト全体でのアーキテクチャ統一

#### 型定義の共有戦略

複雑なPrisma型（リレーション含む）は`packages/database/src/types/`で統一管理してください：

```typescript
// packages/database/src/types/{domain-name}.ts
import { Prisma } from '@prisma/client';

const {domainName}WithDetailsValidator = Prisma.validator<Prisma.{DomainName}DefaultArgs>()({
  include: {
    relatedEntity: {
      select: {
        id: true,
        name: true,
        // bodyフィールドは除外（egress節約）
      },
    },
  },
});

export type {DomainName}WithDetails = Prisma.{DomainName}GetPayload<
  typeof {domainName}WithDetailsValidator
>;
```

## NestJS固有のガイドライン

### 基本原則

- モジュールアーキテクチャを使用します
- APIをモジュールにカプセル化します。
    - メインドメイン/ルートごとに1つのモジュール。
    - ルートごとに1つのコントローラー。
        - セカンダリルート用の他のコントローラー。
    - データ型用のmodelsフォルダー。
        - 入力用のclass-validatorでバリデーションされたDTO。
        - 出力用のシンプルな型の宣言。
        - ビジネスロジックと永続化用のservicesモジュール。
            - Prismaを使用したデータ永続化。
                - `packages/database/prisma/schema.prisma`にデータモデルを定義。
                - 各モデルに対応するRepositoryクラスを実装（命名規則：`{モデル名}Repository`）。
                - ビジネスロジックはServiceクラスに実装（命名規則：`{モデル名}Service`）。
                - トランザクション処理には`$transaction`を使用。
                - リレーションの取得には`include`を使用。
                - クエリの最適化には`select`を使用。
            - エンティティごとに1つのRepositoryとService。
- NestJSアーティファクト用のcoreモジュール
    - 例外処理用のグローバルフィルター。
    - リクエスト管理用のグローバルミドルウェア。
    - 権限管理用のガード。
    - リクエスト管理用のインターセプター。
- モジュール間で共有されるサービス用のsharedモジュール。
    - ユーティリティ
    - 共有ビジネスロジック

## API定義と自動生成コードに関するガイドライン

NestJSバックエンドでは、OpenAPI仕様に基づいたAPI定義を自動生成するために`@nestjs/swagger`を使用します。これにより、フロントエンド開発者がAPIクライアントを生成したり、APIドキュメントを参照したりすることが容易になります。

### ControllerとDTOのアノテーション

- すべてのControllerクラスには`@ApiTags`デコレーターを使用してAPIグループを指定してください。

  ```typescript
  @ApiTags('users')
  @Controller('users')
  export class UserController {
    // ...
  }
  ```

- 各エンドポイント（Controller内のルートハンドラー）には、以下のSwaggerデコレーターを適用してください：
    - `@ApiOperation` - 操作の説明を提供
    - `@ApiResponse` - 予想されるレスポンスを定義
    - `@ApiParam`、`@ApiQuery` - URLパラメーターやクエリパラメーターを記述

  ```typescript
  @Get(':id')
  @ApiOperation({ summary: 'ユーザーの取得', description: 'IDに基づいてユーザー情報を取得します' })
  @ApiParam({ name: 'id', description: 'ユーザーID', type: String })
  @ApiResponse({ status: 200, description: 'ユーザーが正常に取得されました', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    // ...
  }
  ```

- DTOクラスには、`@ApiProperty`デコレーターを使用して、各プロパティの説明、型、例、必須かどうかなどを定義してください。

  ```typescript
  export class CreateUserDto {
    @ApiProperty({
      description: 'ユーザーのメールアドレス',
      example: 'user@example.com',
      required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
      description: 'ユーザーの名前',
      example: '山田太郎',
      required: true,
      minLength: 2,
      maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    name: string;

    @ApiProperty({
      description: 'ユーザーのパスワード',
      example: 'P@ssw0rd',
      required: true,
      minLength: 8,
      maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @Length(8, 100)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: 'パスワードは少なくとも1つの小文字、大文字、数字、特殊文字を含む必要があります',
    })
    password: string;
  }
  ```

- ネストされたDTOやエンティティは`@ApiProperty`の`type`属性を使用して定義してください。

  ```typescript
  export class UserWithPostsDto {
    @ApiProperty({
      description: 'ユーザーID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    })
    id: string;

    @ApiProperty({
      description: 'ユーザーの名前',
      example: '山田太郎',
    })
    name: string;

    @ApiProperty({
      description: 'ユーザーの投稿一覧',
      type: [PostDto],
    })
    posts: PostDto[];
  }
  ```

### OpenAPI仕様の更新と生成

- APIの追加や変更を行った場合は、必ずSwaggerアノテーションを更新してください。
- API仕様はビルドプロセスで自動的に生成され、`api-spec/api-backend-spec.json`に出力されます。
- 手動で仕様を更新するには、以下のコマンドを実行してください：

  ```bash
  yarn workspace @tech-post-cast/api-backend swagger-spec
  ```

### フロントエンドでの利用

- 生成されたOpenAPI仕様は、フロントエンドのAPIクライアント生成に使用されます。
- API仕様を変更した場合は、フロントエンドのAPIクライアントも更新する必要があります。
- フロントエンドチームと事前に変更内容を共有し、後方互換性を維持するよう注意してください。

### OpenAPI関連のベストプラクティス

- 複雑なリクエスト/レスポンス構造には、適切な名前を持つDTOクラスを作成してください。
- エラーレスポンスも適切に定義し、APIユーザーがエラーハンドリングを実装できるようにしてください。
- APIバージョニングを導入する場合は、Swaggerドキュメントにもバージョン情報を含めてください。
- セキュリティスキームを定義し、認証が必要なエンドポイントには`@ApiBearerAuth`などを使用してください。

  ```typescript
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
  ```

- 廃止予定のAPIには`@ApiDeprecated`を使用して、APIユーザーに通知してください。

  ```typescript
  @Get('legacy-endpoint')
  @ApiDeprecated({ description: 'このエンドポイントは将来のリリースで削除されます。新しいAPIを使用してください。' })
  getLegacyData() {
    // ...
  }
  ```

## セキュリティ実装ガイドライン

### リソースアクセス制御

#### 所有者確認パターン（必須）

ユーザーが所有するリソースにアクセスする際は、必ず所有者確認を実装する：

```typescript
// Service層での所有者確認実装例
async getProgramGenerationHistory(userId: string, request: GetDashboardProgramGenerationHistoryRequestDto) {
  // 1. ユーザー存在確認
  await this.validateUserExists(userId);

  // 2. リソース所有者確認（feedIdが指定された場合）
  if (request.feedId) {
    const feed = await this.personalizedFeedsRepository.findById(request.feedId);
    if (!feed || feed.userId !== userId) {
      throw new NotFoundException('指定されたフィードが見つかりません');
    }
  }

  // 3. データ取得処理
  // ...
}
```

#### 情報漏洩防止

エラーメッセージからリソースの存在有無を推測できないよう統一する：

```typescript
// ✅ 推奨: 統一されたエラーメッセージ
if (!feed || feed.userId !== userId) {
  throw new NotFoundException('指定されたフィードが見つかりません');
}
```

### 段階的アクセス制御

リソースの状態に応じた段階的なアクセス制御を実装する：

```typescript
// 非アクティブリソースの制御例
async getPersonalizedProgramDetail(userId: string, programId: string) {
  const program = await this.repository.findByIdWithFeed(programId);

  // 所有者確認
  if (!program || program.feed.userId !== userId) {
    throw new NotFoundException('指定された番組が見つかりません');
  }

  // 非アクティブフィードの番組詳細アクセス制限
  if (!program.feed.isActive) {
    throw new ForbiddenException('非アクティブなフィードの番組詳細にはアクセスできません');
  }

  return program;
}
```

## DTO設計ガイドライン

### ネスト構造による一貫性

関連データは適切にネスト構造で表現し、フロントエンドでの使いやすさを考慮する：

```typescript
// ✅ 推奨：ネスト構造
export class ProgramGenerationHistoryDto {
  id: string;
  executedAt: Date;
  status: string;
  reason: string | null;
  articlesCount: number;

  feed: {
    id: string;
    name: string;
  };

  program: {
    id: string;
    title: string;
    expiresAt: Date;
    isExpired: boolean;
  } | null;
}

// ❌ 非推奨：フラット構造
export class ProgramGenerationHistoryDto {
  id: string;
  executedAt: Date;
  status: string;
  reason: string | null;
  articlesCount: number;
  feedId: string;
  feedName: string;
  programId: string | null;
  programTitle: string | null;
  programExpiresAt: Date | null;
  programIsExpired: boolean | null;
}
```

### 時間経過による状態変化への対応

時間経過により状態が変化するリソースは、現在の状態を含める：

```typescript
export class ProgramDto {
  id: string;
  title: string;
  expiresAt: Date;
  isExpired: boolean; // 現在時刻での期限切れ状態
}
```

### レスポンス構造の標準化

ページネーション対応APIのレスポンス構造を統一する：

```typescript
export class GetDashboardProgramGenerationHistoryResponseDto {
  history: ProgramGenerationHistoryDto[];
  totalCount: number;
  limit: number;
  offset: number;
  hasNext: boolean;
}
```

## API設計パターン

### ダッシュボードAPI設計パターン

ダッシュボード表示用APIでは、用途別に最適化された専用APIを設計してください：

#### 1. 概要情報API（集約型）

```typescript
// GET /dashboard/{domain-name}/summary
export class GetDashboard{DomainName}SummaryResponseDto {
  activeItemsCount: number;        // アクティブアイテム数
  totalItemsCount: number;         // 総アイテム数
  recentItems: {DomainName}SummaryDto[]; // 最新5件
  totalFiltersCount: number;       // 総フィルター数
}
```

**設計理念**: ダッシュボード表示に必要な概要情報を1回のAPI呼び出しで取得

#### 2. 一覧取得API（ページネーション型）

```typescript
// GET /dashboard/{domain-name}
export class GetDashboard{DomainName}ResponseDto {
  items: {DomainName}SummaryDto[];
  totalCount: number;
  limit: number;
  offset: number;
  hasNext: boolean;
}
```

**設計理念**: 大量データの効率的な取得とフロントエンドでの段階的表示

#### パフォーマンス最適化

```typescript
// 大きなページサイズで全件取得（概要情報用）
const itemsResult = await this.repository.findByUserIdWithFilters(
  userId,
  1,
  1000, // 大きなページサイズ
);

// 必要なフィールドのみ選択（egress節約）
relatedEntity: {
  select: {
    id: true,
    title: true,
    // bodyフィールドは除外
  },
},
```

### 統計情報API設計パターン

統計情報は通常の業務ロジックとは異なる要件を持つため、専用メソッドを作成してください：

#### 統計専用メソッドの分離

```typescript
// リポジトリインターフェース
interface I{DomainName}Repository {
  // 通常の業務用途（有効期限チェックあり）
  findByUserIdWithPagination(userId: string, options: PaginationOptions): Promise<{DomainName}Result>;

  // 統計用途（有効期限チェックなし）
  findAllByUserIdForStats(userId: string, options: PaginationOptions): Promise<{DomainName}Result>;
}

// サービス層での使い分け
class DashboardService {
  async getDashboardStats(userId: string) {
    // 統計専用メソッドを使用
    const allItems = await this.repository.findAllByUserIdForStats(userId, options);
    // 統計計算ロジック
  }
}
```

#### 設計理由

1. **単一責任の原則**: 統計用途と業務用途でクエリ条件が異なる
2. **保守性**: 既存メソッドの変更リスクを回避
3. **可読性**: メソッド名で用途が明確
4. **テスタビリティ**: 独立したテストケースで検証可能

#### 統計情報の考慮事項

- 表示文言の変更でも、ビジネスロジックへの影響を事前に確認
- 統計情報は変更頻度が低いため、キャッシュ導入を検討
- 大量データの場合は、事前計算とスナップショット保存を検討
