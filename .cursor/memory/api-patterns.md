# API実装のパターンとベストプラクティス

## パーソナルプログラム関連記事の永続化パターン (2025-05-07)

### 背景と課題

パーソナルプログラム機能では、ユーザー向けに生成された番組内で紹介されたQiita記事を永続化し、後からユーザーが参照できるようにする必要があった。番組生成→ファイルアップロード→記事DB保存→プログラムDB保存という複数のステップを含むフローを設計する必要があった。

### 検討したアプローチ

1. **新規テーブル導入アプローチ**:
   - 記事とプログラムの関連性スコア、言及時間などの追加情報を格納する中間テーブルを新設する
   - メリット: より詳細な情報を保存可能
   - デメリット: スキーマ変更とマイグレーションが必要、実装工数が増加

2. **既存構造活用アプローチ**:
   - 既存のQiitaPostモデルとPersonalizedFeedProgramモデルの多対多関連を利用
   - メリット: シンプルな設計、既存コードの再利用、マイグレーション不要
   - デメリット: 保存できる情報が限定的

### 決定事項と理由

- 既存テーブル構造を活用するアプローチを採用
- 理由:
  1. ユーザー要件を満たすために追加情報（関連性スコア、言及時間など）は必須ではない
  2. HeadlineTopicProgram実装との一貫性を保持できる
  3. 実装工数を大幅に削減でき、早期リリースが可能

### 実装パターン

- **フロー順序**: 音声生成 → ファイルアップロード → 記事DB保存 → プログラムDB保存
- **エラーハンドリング**: エラー種別に特化した例外クラス階層を活用（PersonalizedProgramPersistenceError等）
- **トランザクション処理**: PrismaClientManagerを利用した一貫性のあるDB操作
- **テスト戦略**: モックを活用した単体テスト、型安全性の確保

### 学んだ教訓

1. 新規機能実装時には、まず既存のコードパターンを調査し、再利用可能な部分を特定すべき
2. ユーザー要件を厳密に精査し、過度な設計複雑化を避ける
3. モデル間の関連性（多対多など）を活用することでシンプルな実装が可能
4. TypeScriptのモックデータ作成時はとくに型定義を慎重に行うべき

### 関連タスク

- 記事データ保存プロセス実装 (P1)
- 記事永続化テスト (P1)
- ユーザー記事履歴API実装（予定）

## ダッシュボードAPI設計パターン (2025-01-26)

### 背景と課題

ダッシュボード表示用APIの実装において、複数のデータソースから情報を集約し、フロントエンドに最適化された形で提供する必要があった。とくに以下の要件があった：

- パーソナルフィード概要情報の効率的な取得
- パーソナルプログラム一覧のページネーション対応
- フィルター条件数の集計
- パフォーマンスを考慮したデータ取得

### 検討したアプローチ

1. **個別API提供**: 各データ種別ごとに独立したAPIエンドポイントを提供
   - 利点: 単純な実装、キャッシュ戦略の最適化
   - 欠点: フロントエンドでの複数API呼び出し、ネットワーク負荷増大

2. **集約API提供**: ダッシュボード専用の集約APIエンドポイントを提供
   - 利点: フロントエンドの実装簡素化、ネットワーク効率向上
   - 欠点: API設計の複雑化、キャッシュ戦略の制約

### 決定事項と理由

**用途別に最適化された専用API**を採用し、以下の設計パターンを確立：

#### 1. 概要情報API（集約型）

```typescript
// GET /dashboard/personalized-feeds/summary
export class GetDashboardPersonalizedFeedsSummaryResponseDto {
  activeFeedsCount: number;        // アクティブフィード数
  totalFeedsCount: number;         // 総フィード数
  recentFeeds: PersonalizedFeedSummaryDto[]; // 最新5件
  totalFiltersCount: number;       // 総フィルター数
}
```

**設計理念**: ダッシュボード表示に必要な概要情報を1回のAPI呼び出しで取得

#### 2. 一覧取得API（ページネーション型）

```typescript
// GET /dashboard/personalized-programs
export class GetDashboardPersonalizedProgramsResponseDto {
  programs: PersonalizedProgramSummaryDto[];
  totalCount: number;
  limit: number;
  offset: number;
  hasNext: boolean;
}
```

**設計理念**: 大量データの効率的な取得とフロントエンドでの段階的表示

### 実装詳細とパフォーマンス最適化

#### 1. データ取得の最適化

```typescript
// 大きなページサイズで全件取得（概要情報用）
const feedsResult = await this.personalizedFeedsRepository.findByUserIdWithFilters(
  userId,
  1,
  1000, // 大きなページサイズ
);

// 必要なフィールドのみ選択（egress節約）
posts: {
  select: {
    id: true,
    title: true,
    // bodyフィールドは除外
  },
},
```

#### 2. フィルター条件数の効率的な集計

```typescript
const totalFiltersCount = feedsResult.feeds.reduce((total, feed) => {
  return total + feed.filterGroups.reduce((groupTotal, group) => {
    return groupTotal +
      (group.tagFilters?.length || 0) +
      (group.authorFilters?.length || 0) +
      (group.dateRangeFilters?.length || 0) +
      (group.likesCountFilters?.length || 0);
  }, 0);
}, 0);
```

#### 3. DTO変換の標準化

```typescript
const programDtos: PersonalizedProgramSummaryDto[] = programs.map((program) => ({
  id: program.id,
  title: program.title,
  feedId: program.feedId,
  feedName: program.feed.name, // リレーションデータの活用
  postsCount: program.posts.length, // 集計値の計算
  isExpired: program.isExpired, // ビジネスロジックの結果
  // ... その他必要なフィールド
}));
```

### 学んだ教訓

- **KEY INSIGHT**: ダッシュボードAPIは用途に応じて概要型と一覧型を使い分ける
- 大量データの概要表示では、大きなページサイズでの一括取得が効率的
- フィルター条件数などの集計値は、サービス層で計算してAPIレスポンスに含める
- egressコスト削減のため、不要なフィールド（とくにbodyなど）は明示的に除外する
- リレーションデータを活用して、フロントエンドでの追加API呼び出しを削減

### パフォーマンス考慮事項

1. **データ取得の最適化**: 必要最小限のフィールドのみ取得
2. **集計処理の効率化**: アプリケーション層での集計よりもDB層での集計を優先検討
3. **キャッシュ戦略**: 概要情報は短時間キャッシュ、一覧データは長時間キャッシュ
4. **ページネーション**: offset/limitよりもcursor-basedページネーションを将来検討

### 関連タスク

- ダッシュボード表示用API実装
- PersonalizedFeedsSummary API設計
- PersonalizedPrograms一覧API設計

---

## RestClient形式のAPI実行ファイル作成パターン (2025-01-26)

### 背景と課題

API開発において、手動テストや動作確認のための効率的な方法が必要であった。PostmanやInsomnia等のGUIツールではなく、コードベースで管理できる実行ファイルが求められた。

### 決定事項と理由

**RestClient形式（.httpファイル）**を採用し、以下の構成で実行ファイルを作成：

#### ファイル構成

```sh
rest-client/
└── api-backend/
    ├── dashboard.http          # ダッシュボードAPI
    ├── personalized-feeds.http # パーソナルフィードAPI
    └── auth.http              # 認証関連API
```

#### 実装パターン

```http
### パーソナルフィード概要取得
GET {{baseUrl}}/dashboard/personalized-feeds/summary
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

### パーソナルプログラム一覧取得（基本）
GET {{baseUrl}}/dashboard/personalized-programs
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

### パーソナルプログラム一覧取得（ページネーション）
GET {{baseUrl}}/dashboard/personalized-programs?limit=5&offset=10
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

### エラーケース: 認証なし
GET {{baseUrl}}/dashboard/personalized-programs
Content-Type: application/json
```

#### 変数管理

```http
@baseUrl = http://localhost:3000
@jwtToken = eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 学んだ教訓

- **KEY INSIGHT**: RestClient形式はコードベースでのAPI実行ファイル管理に最適
- 変数を使用することで、環境切り替えが容易
- コメントによる詳細な説明で、API仕様書としても機能
- エラーケースも含めることで、包括的なテストが可能
- バージョン管理システムで履歴管理できるため、チーム共有が効率的

### ベストプラクティス

1. **ファイル命名**: `{domain}.http`形式
2. **セクション分け**: `###`でAPIごとに明確に分離
3. **変数活用**: 環境依存の値は変数化
4. **エラーケース**: 正常系だけでなく異常系も含める
5. **コメント**: 各APIの目的と期待結果を記載

### 関連タスク

- Dashboard API RestClientファイル作成
- API実行環境の整備

---

## ユーザー設定API実装パターン (2025-05-27)

### 背景と課題

TPC-101でユーザー設定の取得・更新・Slack通知テスト機能を実装。既存のAppUserモデルを拡張し、新しいドメイン層を構築する必要があった。主な課題：

- 既存のAppUserモデルとの整合性維持
- 複数アプリケーション間での影響範囲の管理
- セキュリティ考慮（Webhook URLのマスキング）
- 包括的なテストカバレッジの確保

### 検討したアプローチ

#### 1. データモデル設計

**選択肢A**: 新しいUserSettingsテーブルを作成

- 利点: 関心の分離、将来の拡張性
- 欠点: JOIN処理の複雑化、データ整合性の管理

**選択肢B**: 既存のAppUserテーブルを拡張

- 利点: シンプルな実装、パフォーマンス向上
- 欠点: テーブルの肥大化

#### 2. API設計アプローチ

**選択肢A**: userIdパラメータベースのAPI

- 利点: 明示的なユーザー指定
- 欠点: セキュリティリスク、認証との重複

**選択肢B**: AppUserオブジェクトベースのAPI

- 利点: 型安全性、認証との統合
- 欠点: 実装の複雑化

### 決定事項と理由

#### 1. AppUserテーブル拡張を採用

- **理由**: ユーザー設定は基本的なユーザー属性であり、頻繁にアクセスされる
- **追加フィールド**: `slackWebhookUrl` (VARCHAR 500), `notificationEnabled` (Boolean)
- **デフォルト値**: 通知無効、Webhook URL null

#### 2. AppUserオブジェクトベースAPI設計

- **理由**: 型安全性と認証システムとの一貫性を重視
- **パターン**: `getUserSettings(appUser: AppUser)` 形式
- **利点**: 認証済みユーザーのみアクセス、型チェック強化

#### 3. Repository パターンの採用

- **インターフェイス**: `IUserSettingsRepository`
- **実装**: PrismaClientManager活用
- **メソッド**: `findByAppUser`, `updateByAppUser`

#### 4. セキュリティ対策

- **URLマスキング**: ログ出力時にWebhook URLを部分的にマスク
- **バリデーション**: 入力値の厳格なチェック
- **認証**: JWT必須、ClerkJwtGuard使用

### 学んだ教訓

#### KEY INSIGHT: モノレポでのスキーマ変更影響管理

- **教訓**: データベーススキーマ変更時は全アプリケーションのテストファクトリを確認
- **対策**: 新フィールド追加時のチェックリスト作成
- **影響範囲**: `apps/api-backend`, `apps/backend`のファクトリクラス

#### KEY INSIGHT: 段階的実装アプローチの有効性

- **Phase 1**: データベーススキーマ
- **Phase 2**: ドメイン層
- **Phase 3**: インフラ層
- **Phase 4**: コントローラー層
- **Phase 5**: 影響調査と対応
- **Phase 6**: 統合とドキュメント
- **利点**: 各段階での検証、問題の早期発見

#### KEY INSIGHT: TypeScript型定義の一元管理

- **問題**: 複数ファイルでの重複した型定義
- **解決**: `custom.d.ts`での一元管理
- **効果**: OpenAPI仕様生成の安定化

#### KEY INSIGHT: テストファクトリパターンの重要性

- **パターン**: 各ドメインごとのファクトリクラス作成
- **利点**: テストデータの一貫性、メンテナンス性向上
- **実装**: `AppUserFactory`, `UserSettingsFactory`

#### GLOBAL LEARNING: REST Client活用パターン

- **構成**: 正常系、異常系、エラーケースの網羅
- **変数活用**: `@apiBaseUrl`, `@authToken`
- **ドキュメント**: レスポンス例、使用方法の詳細記載

### 技術的発見

#### 1. Prismaでの部分更新パターン

```typescript
// 効果的な部分更新実装
const updateData = Object.fromEntries(
  Object.entries(params).filter(([_, value]) => value !== undefined)
);
```

#### 2. Slack Webhook URLバリデーション

```typescript
// 正規表現パターン
/^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+$/
```

#### 3. fetchモックパターン

```typescript
// グローバルfetchのモック化
global.fetch = jest.fn();
```

### 残された課題と改善点

#### 1. パフォーマンス最適化

- **課題**: ユーザー設定取得時のクエリ最適化
- **提案**: 必要フィールドのみ取得するselect最適化

#### 2. 通知機能の拡張

- **課題**: Slack以外の通知チャネル対応
- **提案**: 通知プロバイダーの抽象化

#### 3. 設定項目の拡張性

- **課題**: 将来的な設定項目追加への対応
- **提案**: JSON型フィールドでの柔軟な設定管理

### 関連タスク

- TPC-101: ユーザー設定取得/更新API実装
- 関連する将来タスク: 通知システム拡張、設定画面UI実装

### メタデータ

- **技術スタック**: NestJS, Prisma, TypeScript, Jest
- **コンポーネント**: API Backend, Database Schema
- **ビジネス要件**: ユーザー個人設定管理、Slack通知

## 番組生成履歴API実装パターン (2024-12-19)

### 背景と課題

ダッシュボード用の番組生成履歴取得APIの実装において、セキュリティ、パフォーマンス、使いやすさを考慮したAPI設計が必要だった。関連データの取得、ページネーション、フィルタリング機能を含む包括的なAPIの設計と実装。

### 検討したアプローチ

1. **レスポンスDTO構造**
   - フラット構造（feedId, feedName分離）vs ネスト構造（feedオブジェクト）
   - ネスト構造を採用（一貫性と使いやすさ）
2. **セキュリティ対策**
   - feedId所有者確認の有無
   - 情報漏洩防止のためのエラーメッセージ統一
3. **非アクティブリソース対応**
   - 完全除外 vs 履歴表示可能・詳細アクセス制限
   - 後者を採用（履歴の完全性保持）

### 決定事項と理由

1. **DTO構造の改善**: `feed: { id, name }`形式でオブジェクト化（一貫性向上）
2. **セキュリティ強化**: feedId所有者確認を実装（不正アクセス防止）
3. **エラーメッセージ統一**: 存在しないfeedIdと所有者でないfeedIdで同じメッセージ（情報漏洩防止）
4. **非アクティブフィード対応**: 履歴表示は可能、詳細アクセスは制限（UX配慮）
5. **ページネーション標準化**: limit, offset, totalCountの標準形式採用
6. **番組有効期限対応**: 期限切れ番組の詳細アクセス制限とUI表示制御

### 実装パターン

#### 1. セキュリティ強化パターン

```typescript
// feedId所有者確認
if (feedId) {
  const feed = await this.personalizedFeedsRepository.findById(feedId);
  if (!feed || feed.userId !== userId) {
    throw new NotFoundException('指定されたフィードが見つかりません');
  }
}
```

#### 2. 関連データ取得パターン

```typescript
// Prismaのincludeを使用した効率的な関連データ取得
const result = await this.personalizedProgramAttemptsRepository
  .findByUserIdWithRelationsForDashboard(userId, { feedId, limit, offset });
```

#### 3. DTO変換パターン

```typescript
const historyDtos: ProgramGenerationHistoryDto[] = attempts.map((attempt) => ({
  id: attempt.id,
  executedAt: attempt.executedAt,
  status: attempt.status,
  reason: attempt.reason,
  articlesCount: attempt.articlesCount,
  feed: {
    id: attempt.feed.id,
    name: attempt.feed.name,
  },
  program: attempt.program ? {
    id: attempt.program.id,
    title: attempt.program.title,
    expiresAt: attempt.program.expiresAt,
    isExpired: attempt.program.isExpired,
  } : null,
}));
```

### 学んだ教訓

- **セキュリティファースト**: リソースアクセス時の所有者確認は必須
- **情報漏洩防止**: エラーメッセージからリソース存在有無を推測させない
- **DTO設計の重要性**: フロントエンドでの使いやすさを考慮した構造設計
- **段階的アクセス制御**: 履歴表示と詳細アクセスで異なる制御レベル
- **有効期限考慮**: 時間経過による状態変化を適切にハンドリング

### 関連タスク

TPC-101 ユーザーダッシュボードの実装

## フロントエンド・バックエンド連携パターン (2025-01-23)

### 背景と課題

ユーザー設定画面でフロントエンドとバックエンドのバリデーション仕様の不整合が発生。空文字のWebhook URLでバックエンドが400エラーを返す問題。

### 検討したアプローチ

1. **フロントエンド側対応**: 空文字を送信しない
2. **バックエンド側対応**: `@IsUrl()`を`@Matches()`に変更して空文字を許可
3. **仕様統一**: 通知無効時は強制的に空文字を送信する仕様に統一

### 決定事項と理由

- **バックエンド側の修正**: `@Matches()`で空文字とSlack URLの両方を許可
- **フロントエンド仕様統一**: 通知無効時は必ず空文字を送信
- **明確な仕様定義**: 通知有効時はWebhook URL必須、無効時は削除

### 学んだ教訓

1. **フロント・バック仕様の事前調整**: バリデーション仕様は実装前に詳細に調整する
2. **エラーハンドリングの詳細化**: HTTPステータス、サーバーメッセージを含む詳細なエラー表示
3. **任意項目の扱い**: 任意項目でも業務ロジックに応じた適切な制約設計が必要

### 関連タスク

TPC-101 ユーザーダッシュボードの実装

---

## OpenAPI自動生成クライアントの活用 (2025-01-23)

### 背景と課題

手動でAPIクライアントを作成していたが、バックエンドのOpenAPI定義から自動生成する方式に変更。

### 検討したアプローチ

1. **手動実装**: 個別にAPI関数を作成
2. **自動生成**: `yarn generate:api-client`でOpenAPI定義から生成

### 決定事項と理由

- **自動生成の採用**: バックエンドとの型安全性と同期を確保
- **プラグイン統合**: `plugins/api-client.ts`で各APIクラスを提供
- **composable連携**: 生成されたAPIクライアントをcomposableで活用

### 学んだ教訓

- **型安全性の重要性**: 自動生成により型の不整合を防止
- **開発効率の向上**: API定義変更時の手動修正作業を削減
- **一貫性の確保**: バックエンドとフロントエンドの型定義を統一

### 関連タスク

TPC-101 ユーザーダッシュボードの実装

---

## エラーハンドリングのベストプラクティス (2025-01-23)

### 背景と課題

APIエラー時に「Request failed with status code 400」のような汎用的なメッセージしか表示されず、ユーザーが問題を特定できない。

### 検討したアプローチ

1. **汎用エラーメッセージ**: 固定文言のみ表示
2. **詳細エラー情報**: HTTPステータス、サーバーメッセージを含む表示

### 決定事項と理由

- **段階的エラー情報抽出**: response.data.message → response.status → err.message の順で確認
- **ユーザーフレンドリーな表示**: 技術的詳細を含みつつ理解しやすい形式
- **デバッグ情報の保持**: console.errorで詳細ログを出力

### 学んだ教訓

- **エラー情報の階層化**: 複数のエラー情報源から適切な情報を選択
- **ユーザビリティとデバッグの両立**: 表示用とログ用で情報レベルを分ける
- **型安全なエラーハンドリング**: TypeScriptでのエラーオブジェクト型チェック

### 関連タスク

TPC-101 ユーザーダッシュボードの実装

## バリデーション機能の設計パターン (2025-05-30)

### 背景と課題

フロントエンドでのリアルタイムバリデーション機能において、再利用可能で保守性の高い設計パターンの確立が必要だった。既存のエラーハンドリングとの統合、プラン別制限値への対応、段階的導入の実現が課題。

### 検討したアプローチ

1. **単一のバリデーション関数**: すべてのバリデーションを1つの関数で処理
   - 利点: シンプルな構造
   - 欠点: 拡張性が低い、テストが困難
2. **フィールド別バリデーション関数**: 各フィールドごとに独立したバリデーション関数
   - 利点: 単体テストが容易、再利用性が高い
   - 欠点: フィールド間の関連性を扱いにくい
3. **階層化バリデーション**: フィールド別 + 全体バリデーションの組み合わせ
   - 利点: 柔軟性と保守性のバランス
   - 欠点: 若干の複雑性

### 決定事項と理由

#### 階層化バリデーション + Composable パターンを採用

- フィールド別バリデーション関数で個別検証
- 全体バリデーション関数でフィールド間の関連性を検証
- Composableでリアクティブな状態管理とデバウンス機能を提供

### 学んだ教訓

#### KEY INSIGHT: バリデーション関数の設計原則

```typescript
// 各バリデーション関数は統一されたインターフェースを持つ
interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// プラン別制限値をパラメータ化
export const validateTagsFilter = (tags: string[], maxTags: number = 10): FieldValidationResult
```

#### KEY INSIGHT: Composableでの状態管理パターン

```typescript
// リアクティブな状態管理とデバウンス機能の統合
export const useFeedValidation = (
  feedData: Ref<InputPersonalizedFeedData>,
  options: ValidationOptions = {}
) => {
  const validationResult = ref<ValidationResult>({ isValid: true, errors: {}, warnings: {} });

  // デバウンス付きバリデーション実行
  const debouncedValidate = useDebounceFn(() => {
    validationResult.value = validateFeedData(feedData.value, options);
  }, options.debounceDelay || 500);

  // リアルタイムバリデーションの監視
  if (options.realtime) {
    watch(feedData, debouncedValidate, { deep: true });
  }

  return { validationResult, isValid, getFieldErrors, /* ... */ };
};
```

#### KEY INSIGHT: 既存機能との統合パターン

```typescript
// 新しいバリデーションと既存のエラーハンドリングを統合
const getFieldErrors = (field: string): string[] => {
  const validationErrors = getValidationFieldErrors(field);
  const propsErrors = props.fieldErrors[field] || [];
  return [...validationErrors, ...propsErrors];
};
```

#### GLOBAL LEARNING: 段階的導入のための設計

- 既存のpropsとの互換性を保持
- 新機能をオプショナルにして段階的に導入可能
- 既存のエラーハンドリングを置き換えるのではなく拡張

### 実装パターンの利点

1. **再利用性**: 他のフォーム画面でも同じパターンを適用可能
2. **テスタビリティ**: 各バリデーション関数を独立してテスト可能
3. **拡張性**: 新しいバリデーションルールを容易に追加可能
4. **保守性**: 関心の分離により、変更の影響範囲を限定

### 関連タスク

- TPC-101: ユーザーダッシュボードの実装
- パーソナルフィード管理画面のバリデーション機能統合

## Slack通知サービスの実装パターン (2025-01-10)

### 背景と課題

パーソナルプログラム生成結果をユーザーのSlackに通知する機能を実装。エラー理由コードの日本語化とユーザー体験を重視した通知設計が必要だった。

### 検討したアプローチ

1. **エラー理由の表示方法**
   - データベース側で日本語を保存: データ整合性の課題
   - 表示層での変換: 柔軟性と保守性を重視
   - 設定ファイルでの管理: 過度な複雑化の懸念

2. **通知メッセージの表現**
   - 丁寧語（「〜が発生しました」）: 正式だが冗長
   - 簡潔な表現（「〜エラー」）: Slack通知に適している

### 決定事項と理由

- **表示層での理由コード変換を採用**
    - `SlackNotificationService.getReasonText()`メソッドで変換
    - 未知のコードに対するフォールバック処理を実装
    - 理由: 再利用性と影響範囲の最小化

- **簡潔な表現を採用**
    - ユーザーの指示により、より簡潔な表現に調整
    - 理由: Slack通知の特性とユーザビリティを重視

### 学んだ教訓

- **KEY INSIGHT**: 通知は技術的な実装だけでなく、ユーザー体験設計が重要
- エラーメッセージはエンドユーザー向けに最適化すべき
- 通知はマーケティングツールとしての側面も持つ（サービス誘導）
- 時間帯別挨拶などの細かい配慮がユーザー体験を向上させる

### 実装パターン

```typescript
// エラー理由コードの日本語化パターン
private static getReasonText(reason: string): string {
  switch (reason) {
    case 'NOT_ENOUGH_POSTS':
      return '紹介記事数が不足';
    case 'UPLOAD_ERROR':
      return 'アップロードエラー';
    // ... 他のケース
    default:
      return reason; // フォールバック
  }
}

// 時間帯別メッセージ生成パターン
private static getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return '🌅 おはようございます';
  // ... 他の時間帯
}
```

### 関連タスク

TPC-106: パーソナルプログラムの配信タイミングでユーザーに通知する

## 統計情報API設計パターン (2025-01-15)

### 背景と課題

ダッシュボードの統計情報で「月間配信数」から「総配信数（累計）」への変更要求があり、有効期限切れの番組も含める必要が発生。既存のページネーション用メソッドでは有効期限切れの番組が除外されていた。

### 検討したアプローチ

1. **既存メソッドの条件分岐追加**: パラメーターで有効期限チェックのON/OFFを制御
2. **統計専用メソッドの新規作成**: 統計用途に特化したクエリメソッドを分離
3. **統計専用サービスの作成**: 統計情報取得を専門に扱うサービス層を新設

### 決定事項と理由

**統計専用メソッドの新規作成**を採用

**理由:**

- 単一責任の原則: 統計用途と業務用途でクエリ条件が異なる
- 保守性: 既存メソッドの変更リスクを回避
- 可読性: メソッド名で用途が明確
- テスタビリティ: 独立したテストケースで検証可能

### 実装パターン

```typescript
// リポジトリインターフェース
interface IPersonalizedProgramsRepository {
  // 通常の業務用途（有効期限チェックあり）
  findByUserIdWithPagination(userId: string, options: PaginationOptions): Promise<PersonalizedProgramsResult>;

  // 統計用途（有効期限チェックなし）
  findAllByUserIdForStats(userId: string, options: PaginationOptions): Promise<PersonalizedProgramsResult>;
}

// サービス層での使い分け
class DashboardService {
  async getDashboardStats(userId: string) {
    // 統計専用メソッドを使用
    const allPrograms = await this.personalizedProgramsRepository.findAllByUserIdForStats(userId, options);
    // 統計計算ロジック
  }
}
```

### 学んだ教訓

1. **KEY INSIGHT**: 表示文言の変更でも、ビジネスロジックへの影響を事前に確認する
2. 統計情報は通常の業務ロジックとは異なる要件を持つことが多い
3. メソッド名で用途を明確にすることで、将来の保守性が向上
4. API仕様変更時は、フロントエンドの型定義更新まで含めて完了とする

### 関連タスク

- ダッシュボード統計情報の累計表示対応
- DTOプロパティ名の統一（monthlyEpisodesCount → totalEpisodesCount）

### パフォーマンス考慮事項

- 統計情報は変更頻度が低いため、キャッシュ導入を検討
- 大量データの場合は、事前計算とスナップショット保存を検討
- 統計専用のインデックス設計を検討

## Vue.js + Clerkでの認証トークン管理パターン (2024-12-19)

### 背景と課題

パーソナルプログラム一覧のAPIリクエストで401認証エラーが発生。Clerkの認証トークンがAPIリクエストに含まれていないことが原因。

**技術的制約**

- Vueのコンポーザブル（`useAuth()`）はsetup関数内でのみ使用可能
- プラグインやコンポーザブル関数内では直接使用できない
- `inject() can only be used inside setup() or functional components`エラーが発生

### 検討したアプローチ

1. **プラグインレベルでのaxiosインターセプター設定**

   ```typescript
   // 失敗例
   axiosInstance.interceptors.request.use(async (config) => {
     const { getToken } = useAuth(); // エラー: setup関数外での使用
     const token = await getToken({ template: 'default' });
     config.headers.Authorization = `Bearer ${token}`;
     return config;
   });
   ```

   - 利点: 全APIリクエストに自動適用
   - 欠点: Vueのコンポーザブル制約により実装不可

2. **認証ヘルパーコンポーザブルの作成**

   ```typescript
   // 失敗例
   export const useAuthenticatedApi = () => {
     const { getToken } = useAuth(); // エラー: setup関数外での使用
     return { createAuthConfig };
   };
   ```

   - 利点: 再利用可能な認証ロジック
   - 欠点: 同様のVue制約により実装不可

3. **コンポーネントレベルでの認証トークン取得（採用）**

   ```typescript
   // 成功例
   // コンポーネント内
   const { getToken } = useAuth();
   const token = await getToken({ template: 'default' });

   // コンポーザブルに渡す
   const result = await useGetCurrentPagePersonalizedPrograms(app, page, token);
   ```

   - 利点: Vueの制約に準拠、シンプルで理解しやすい
   - 欠点: 各コンポーネントで認証処理が必要

### 決定事項と理由

**採用したパターン**

```typescript
// コンポーザブル関数
export const useGetPersonalizedPrograms = async (
  app: NuxtApp,
  page: number,
  limit: number,
  token: string | null, // 認証トークンをパラメータとして受け取る
): Promise<PersonalizedProgramSummaryDto[]> => {
  const { $dashboardApi } = app;
  const dashboardApi = $dashboardApi as DashboardApi;

  const response = await dashboardApi.getDashboardPersonalizedPrograms(limit, offset, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.programs;
};

// コンポーネント内
const { getToken } = useAuth();
const token = await getToken({ template: 'default' });
const programs = await useGetPersonalizedPrograms(app, page, limit, token);
```

**決定理由**

1. **Vue.jsの制約への準拠**: setup関数内でのみコンポーザブルを使用
2. **明示的な依存関係**: 認証が必要なAPIが明確
3. **テスタビリティ**: トークンをパラメーターとして渡すことでテストが容易
4. **エラーハンドリング**: 認証エラーをコンポーネントレベルで適切に処理可能

### 学んだ教訓

#### KEY INSIGHT: Vue.jsコンポーザブルの使用制約

1. **setup関数の制約**
   - `useAuth()`などのコンポーザブルはsetup関数内でのみ使用可能
   - プラグインや他のコンポーザブル関数内では使用不可
   - この制約を理解した設計が重要

2. **認証トークンの取得タイミング**
   - コンポーネントレベルでの取得がもっとも安全
   - 必要な時点での取得により、トークンの有効性を確保

3. **依存関係の明示化**
   - 認証が必要なAPIを明示的に示すことで、コードの理解性向上
   - デバッグ時の問題特定が容易

#### ベストプラクティス

1. **認証が必要なコンポーザブルの設計**

   ```typescript
   // 推奨パターン
   export const useAuthenticatedApiCall = async (
     token: string | null,
     // その他のパラメータ
   ) => {
     // API呼び出し処理
   };
   ```

2. **エラーハンドリング**

   ```typescript
   // コンポーネント内
   try {
     const token = await getToken({ template: 'default' });
     if (!token) {
       throw new Error('認証トークンの取得に失敗しました');
     }
     const result = await useAuthenticatedApiCall(token);
   } catch (error) {
     // 適切なエラー処理
   }
   ```

3. **型安全性の確保**

   ```typescript
   // トークンの型を明示
   token: string | null
   ```

### 関連タスク

- TPC-117: パーソナルプログラム一覧でページングが機能しない
- 認証が必要な他のAPIエンドポイントでの同様パターンの適用検討

## RSS機能のAPI設計パターン (2024-12-19)

### 背景と課題

- パーソナルプログラムのRSS配信機能を実装する際、以下の要件を満たす必要があった：
    - RSS機能の有効化/無効化
    - RSSトークンの生成・再生成
    - RSSファイルの自動生成・アップロード・削除
    - セキュリティを考慮したトークン管理

### 検討したアプローチ

1. **単一エンドポイントアプローチ**: 全てのRSS操作を1つのエンドポイントで処理
   - 利点: エンドポイント数が少ない
   - 欠点: 責任が曖昧、RESTful設計に反する

2. **機能別エンドポイント分離**: 各機能を独立したエンドポイントに分離
   - 利点: 単一責任原則、RESTful設計、明確なAPI仕様
   - 欠点: エンドポイント数が増加

### 決定事項と理由

**機能別エンドポイント分離アプローチを採用**

**実装したエンドポイント:**

1. `GET /user-settings`: RSS設定を含むユーザー設定取得
2. `PUT /user-settings`: RSS有効化/無効化を含む設定更新
3. `POST /user-settings/rss/regenerate-token`: RSSトークン再生成専用

**設計原則:**

- **単一責任原則**: 各エンドポイントが明確な責任を持つ
- **RESTful設計**: HTTPメソッドとリソースの適切な対応
- **セキュリティ配慮**: RSSトークンのマスク表示、適切なエラーハンドリング

### 学んだ教訓

1. **KEY INSIGHT**: RSS機能のライフサイクル管理（有効化→ファイル生成、無効化→ファイル削除、トークン再生成→古いファイル削除＋新しいファイル生成）を自動化することで、ユーザビリティが大幅に向上
2. エラーハンドリングにおいて、主要な処理（設定更新）とサブ処理（ファイル操作）を分離し、サブ処理のエラーが主要処理を阻害しないよう設計することが重要
3. セキュリティトークンのログ出力時は必ずマスク処理を実装する
4. 非同期ファイル操作（生成・アップロード・削除）の適切なエラーハンドリングとリソース管理が重要

**実装パターン:**

```typescript
// RSS設定更新時の自動ファイル管理
if (rssEnabled && !existingRssToken) {
  // 新規有効化: トークン生成 + ファイル生成・アップロード
} else if (!rssEnabled && existingRssToken) {
  // 無効化: 古いファイル削除
}

// エラーハンドリング: 主要処理は継続、サブ処理エラーは警告ログ
try {
  await this.rssFileService.deleteUserRssFile(userId, existingRssToken);
} catch (error) {
  this.logger.warn('RSS無効化時の古いファイル削除に失敗しましたが、RSS設定更新は継続します', { userId, error: error.message });
}
```

### 関連タスク

- TPC-92: パーソナルプログラムのRSSを出力できるようにする
- UserSettingsController拡張タスク
