# NestJS バックエンド実装ルール

**適用対象**: `apps/api-backend/**`, `apps/backend/**`

## アーキテクチャパターン

### Controller-Service-Repository パターンの徹底

**必須**: 全てのビジネスロジックは以下の3層アーキテクチャに従って実装してください。

```
Controller → Service → Repository
```

#### 各層の責任

1. **Controller層**
   - HTTPリクエスト/レスポンスの処理
   - バリデーション結果の確認
   - 適切なHTTPステータスコードの返却
   - **禁止**: ビジネスロジックの実装、Repositoryの直接呼び出し

2. **Service層**
   - ビジネスロジックの実装
   - 複数のRepositoryの協調
   - データの変換・計算処理
   - **推奨**: 単一責任の原則に従った設計

3. **Repository層**
   - データアクセスのみに特化
   - Prismaクライアントの操作
   - **禁止**: ビジネスロジックの実装

#### 実装例

```typescript
// ❌ 悪い例: ControllerがRepositoryを直接呼び出し
@Controller('example')
export class ExampleController {
  constructor(
    private readonly exampleRepository: ExampleRepository
  ) {}

  async getStats() {
    return await this.exampleRepository.getStatsByDate(); // NG
  }
}

// ✅ 良い例: 適切な3層アーキテクチャ
@Controller('example')
export class ExampleController {
  constructor(
    private readonly exampleService: ExampleService
  ) {}

  async getStats(@Body() dto: StatsRequestDto) {
    return await this.exampleService.getStatsByDaysAgo(dto.daysAgo);
  }
}

@Injectable()
export class ExampleService {
  constructor(
    private readonly exampleRepository: ExampleRepository
  ) {}

  async getStatsByDaysAgo(daysAgo: number = 0): Promise<Stats> {
    const targetDate = this.calculateTargetDate(daysAgo);
    return await this.exampleRepository.getStatsByDate(targetDate);
  }

  private calculateTargetDate(daysAgo: number): Date {
    // ビジネスロジック: 日付計算
  }
}
```

### 統計データ取得の設計パターン

#### 単一の真実の源泉原則

統計データは可能な限りデータベースから直接取得し、外部システムからの受け渡しに依存しないようにしてください。

```typescript
// ❌ 悪い例: 外部データに依存
async finalize(@Body() stats: ExternalStats) {
  // 外部から渡されたデータをそのまま使用
  await this.notifySlack(stats);
}

// ✅ 良い例: データベースから統計を取得
async finalize(@Body() dto: FinalizeRequestDto) {
  const stats = await this.statsService.getStatsByDaysAgo(dto.daysAgo);
  await this.notifySlack(stats);
}
```

#### 統計データインターフェースの設計

```typescript
interface ProgramGenerationStats {
  totalFeeds: number;
  successCount: number;
  skippedCount: number;      // 全ステータスを考慮
  failedFeedIds: string[];   // エラー詳細は失敗時のみ
  timestamp: number;
}
```

**重要**:

- 全ての可能なステータス（SUCCESS/SKIPPED/FAILED）を考慮する
- エラー詳細情報は失敗時のみ保持する
- 将来の拡張を考慮した構造にする

## DTOとバリデーション

### 日付処理を含むDTO

日付計算が必要なDTOでは、計算ロジックをDTOメソッドとして実装してください。

```typescript
export class FinalizeRequestDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  daysAgo?: number;

  getTargetDate(): Date {
    const daysAgo = this.daysAgo ?? 0;
    return getStartOfDay(subtractDays(new Date(), daysAgo), TIME_ZONE_JST);
  }
}
```

## エラーハンドリングとロギング

### ステータス別処理

業務上の全ステータスを適切に処理し、ユーザーに分かりやすい形で通知してください。

```typescript
// 通知メッセージの例
const message = `
パーソナルプログラムの一括生成処理が完了しました
- 成功: ${stats.successCount} 件
- スキップ: ${stats.skippedCount} 件
- 失敗: ${stats.failedFeedIds.length} 件
- 失敗したパーソナルフィードID: ${failedFeedIds}
`;
```

## モジュール設計

### 依存性注入の適切な設定

Serviceを新規作成した場合は、必ずModuleのprovidersに追加してください。

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [ExampleController],
  providers: [
    ExampleService,           // 新規追加時は忘れずに
    ExampleRepository,
  ],
  exports: [ExampleService],  // 他モジュールで使用する場合
})
export class ExampleModule {}
```

## 既存コード

### 実装前の確認事項

新機能実装時は以下を確認してください：

1. **類似機能の実装パターン確認**
   - 同じアプリケーション内に類似のService/Repositoryが存在するか
   - 他のアプリケーション（api-backend/backend）での実装パターン

2. **共通化の検討**
   - 複数のアプリケーションで同じロジックが必要か
   - 共有パッケージ化すべきか

3. **アーキテクチャの一貫性**
   - 既存のController-Service-Repositoryパターンに従っているか
   - 命名規則が統一されているか

### レガシーコードの改善

既存のController→Repository直接呼び出しパターンを発見した場合は、段階的にService層を導入してください。

```typescript
// Phase 1: Serviceを作成
@Injectable()
export class NewService {
  constructor(private readonly repository: ExistingRepository) {}

  async businessLogic() {
    // 既存のControllerからビジネスロジックを移動
  }
}

// Phase 2: Controllerを更新
// Phase 3: 不要なRepository注入を削除
```
