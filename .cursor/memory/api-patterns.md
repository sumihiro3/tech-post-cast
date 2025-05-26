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
