# テスト戦略と手法

## TypeScriptプロジェクトにおけるモックとテスト型安全性 (2025-05-07)

### 背景と課題

パーソナルプログラム記事永続化機能のテスト時に、TypeScriptの型エラーに関する課題が発生した。テストで使用するモックデータが正確な型を満たしておらず、テスト実行前にコンパイルエラーが発生していた。とくに複雑なオブジェクト構造を持つスキーマ（PersonalizedProgramScriptなど）のモック作成において、型安全性の確保が課題となった。

### 検討したアプローチ

1. **型定義の無視**:
    - 型キャストや`any`型の使用でエラーを無視
    - メリット: 実装が簡単で迅速
    - デメリット: 型安全性の恩恵を失い、実行時エラーのリスク増加
2. **正確なモックデータ作成**:
    - スキーマ定義を確認し、完全に型に適合したモックデータを作成
    - メリット: 完全な型安全性、テストの信頼性向上
    - デメリット: 実装の手間、スキーマ変更時の保守負担
3. **型アサーションの部分的使用**:
    - 基本構造は正確に実装し、一部のみ型アサーションを使用
    - メリット: 重要な部分の型安全性は保持しつつ、実装負荷軽減
    - デメリット: 部分的に型安全性を犠牲にする

### 決定事項と理由

- 「正確なモックデータ作成」アプローチを採用
- 理由:
  1. テストの信頼性と品質を最優先に考慮
  2. 型エラーの早期発見によるバグ混入防止
  3. スキーマ変更時に影響を受ける箇所が明確になる
  4. モックデータを正確に定義することで実装の理解が深まる

### 実装手法

- **スキーマファイルの参照**: 対象スキーマの定義を直接確認（personalizedProgramScriptSchema等）
- **型修正手順**:
  1. エラーメッセージから不適合な属性を特定（例: `introduction` → `opening`）
  2. 型定義ファイルと実際のコードの不一致を修正
  3. モックデータを型定義に合わせて更新
  4. 部分的に `as` を使った型アサーション（必要最小限で使用）
- **テスト実行前の型チェック**: `tsc --noEmit` によるコンパイルエラーの確認

### 学んだ教訓

1. モックデータ作成時は必ず正確な型定義を参照して実装すべき
2. 型定義とスキーマ変更が同期していることを常に確認する仕組みが重要
3. 単にテストが通ることだけでなく、型安全性も担保することでより信頼性の高いコードを維持できる
4. TypeScriptの型エラーは「面倒な障害」ではなく「早期のバグ発見機会」と捉えるべき
5. モックデータ作成用のユーティリティ/ファクトリ関数の整備が有効

### 関連タスク

- 記事データ保存プロセス実装 (P1)
- 記事永続化テスト (P1)

## ファクトリクラスによるテストデータ管理戦略 (2025-01-26)

### 背景と課題

ダッシュボード表示用API実装のテスト作成において、当初テストファイル内で直接モックデータを作成していた。これにより以下の問題が発生：

- テストデータの重複定義
- データ構造変更時の修正箇所の分散
- テストデータの一貫性の欠如
- 複雑なオブジェクト構造の可読性低下

### 検討したアプローチ

1. **テスト内直接定義**: 各テストファイルでモックデータを直接作成
   - 利点: 実装が簡単、テスト固有のカスタマイズが容易
   - 欠点: 重複コード、メンテナンス性低下、一貫性の問題

2. **ファクトリクラスパターン**: 共通のファクトリクラスでテストデータを管理
   - 利点: 再利用性、一貫性、メンテナンス性向上
   - 欠点: 初期実装コスト、抽象化レベルの調整が必要

### 決定事項と理由

**ファクトリクラスパターンを採用**し、以下の設計原則を確立：

#### ファクトリクラス設計原則

```typescript
// src/test/factories/personalized-program.factory.ts
export class PersonalizedProgramFactory {
  // 基本的なデータ作成メソッド
  static createPersonalizedProgram(overrides: Partial<PersonalizedFeedProgramWithDetails> = {}): PersonalizedFeedProgramWithDetails {
    return {
      id: 'test-program-id',
      title: 'テストプログラム',
      // ... デフォルト値
      ...overrides, // 上書き可能
    };
  }

  // 複数データ作成メソッド
  static createPersonalizedPrograms(count: number, overrides = {}): PersonalizedFeedProgramWithDetails[] {
    return Array.from({ length: count }, (_, index) =>
      this.createPersonalizedProgram({
        id: `test-program-id-${index + 1}`,
        ...overrides,
      }),
    );
  }

  // 特定用途向けメソッド
  static createExpiredPersonalizedProgram(overrides = {}): PersonalizedFeedProgramWithDetails {
    return this.createPersonalizedProgram({
      expiresAt: new Date('2023-01-01'), // 過去の日付
      isExpired: true,
      ...overrides,
    });
  }
}
```

#### インデックスファイルでの統一管理

```typescript
// src/test/factories/index.ts
export * from './personalized-program.factory';
export * from './personalized-feed.factory';
export * from './headline-topic-program.factory';
```

### 実装詳細と成果

1. **PersonalizedProgramFactory**: 5つのメソッドでさまざまなテストシナリオに対応
2. **PersonalizedFeedFactory**: 4つのメソッドでフィード関連テストをサポート
3. **既存テストの移行**: 全テストファイルをファクトリクラス使用に更新
4. **テスト成功率**: 全18テストスイート、147テストが成功

### 学んだ教訓

- **KEY INSIGHT**: ファクトリクラスは必須の実装パターンとして位置づけるべき
- `overrides`パラメーターにより、デフォルト値と個別カスタマイズの両立が可能
- 特定用途向けメソッド（expired、inactive等）により、テストシナリオの表現力が向上
- インデックスファイルによる統一管理で、import文の簡潔化が実現

### ベストプラクティス

1. **命名規則**: `{DomainName}Factory`
2. **メソッド命名**: `create{EntityName}`, `create{EntityName}s`, `create{SpecificCase}{EntityName}`
3. **overridesパターン**: 必ず`Partial<T>`型のoverridesパラメーターを提供
4. **デフォルト値**: 実際のビジネスロジックに近い、意味のあるデフォルト値を設定
5. **型安全性**: 元の型定義と完全に一致する型を返却

### 関連タスク

- PersonalizedProgramsRepository テスト実装
- DashboardService テスト実装
- ファクトリクラス統合作業

---

## エラーハンドリングのテスト戦略 (2025-01-26)

### 背景と課題

Repository層でのエラーハンドリング実装において、適切なテストカバレッジを確保する必要があった。とくに、Prismaエラーを適切にカスタムエラーに変換する処理のテストが重要であった。

### 検討したアプローチ

1. **正常系のみテスト**: 成功ケースのみをテスト対象とする
   - 利点: 実装が簡単、テスト実行時間短縮
   - 欠点: エラーハンドリングの品質保証不足

2. **包括的エラーテスト**: 正常系・異常系の両方を網羅的にテスト
   - 利点: 高い品質保証、エラー処理の信頼性向上
   - 欠点: テスト実装コスト増大、メンテナンス負荷

### 決定事項と理由

**包括的エラーテスト**を採用し、以下のテストパターンを確立：

#### エラーハンドリングテストパターン

```typescript
describe('findByUserIdWithPagination', () => {
  it('正常ケース: データ取得成功', async () => {
    // 正常系テスト
  });

  it('エラーケース: PersonalizedProgramRetrievalErrorをスロー', async () => {
    // Prismaエラーをモック
    mockPrismaService.personalizedFeedProgram.findMany.mockRejectedValue(
      new Error('Database connection failed'),
    );

    // カスタムエラーがスローされることを確認
    await expect(
      repository.findByUserIdWithPagination('user-1', options),
    ).rejects.toThrow(PersonalizedProgramRetrievalError);
  });

  it('空結果ケース: 空配列を返却', async () => {
    // 空結果のテスト
  });
});
```

### 学んだ教訓

- **KEY INSIGHT**: Repository層では必ず正常系・異常系・境界値の3パターンをテストする
- Prismaエラーのモック化により、データベース接続エラーなどの再現が可能
- カスタムエラークラスの使用により、エラーの種類を明確に分類できる
- ログ出力もテスト対象に含めることで、デバッグ時の情報提供を保証

### 関連タスク

- PersonalizedProgramsRepository エラーハンドリング実装
- カスタムエラークラス定義

---

## ユーザー設定API テスト戦略 (2025-05-27)

### 背景と課題

TPC-101でユーザー設定APIの包括的なテスト実装を行った。主な課題：

- 外部API（Slack Webhook）のモック化
- 複数層（Service, Repository, Controller）の統合テスト
- モノレポ環境での既存テストへの影響最小化
- 型安全性を保ったテストファクトリの設計

### 検討したアプローチ

#### 1. 外部API通信のテスト手法

**選択肢A**: 実際のSlack APIを使用

- 利点: 実環境に近いテスト
- 欠点: テストの不安定性、外部依存

**選択肢B**: HTTP通信ライブラリのモック

- 利点: 安定したテスト、高速実行
- 欠点: 実装の複雑化

**選択肢C**: global.fetchのモック化

- 利点: シンプルな実装、Node.js標準API使用
- 欠点: モック設定の詳細管理が必要

#### 2. テストファクトリの設計

**選択肢A**: 各テストファイルで個別にモックデータ作成

- 利点: テスト固有の調整が容易
- 欠点: 重複コード、メンテナンス性低下

**選択肢B**: 共通ファクトリクラスの活用

- 利点: 一貫性、再利用性、メンテナンス性
- 欠点: 初期設計の複雑化

### 決定事項と理由

#### 1. global.fetchモック化を採用

- **理由**: Node.js 18+の標準fetch APIを活用、シンプルな実装
- **実装パターン**:

```typescript
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
```

#### 2. 共通テストファクトリパターンの採用

- **AppUserFactory**: アプリユーザーのモックデータ生成
- **UserSettingsFactory**: ユーザー設定のモックデータ生成
- **利点**: データ一貫性、型安全性、再利用性

#### 3. 3層テスト戦略

- **Service層**: ビジネスロジックの単体テスト（26テスト）
- **Repository層**: データアクセスの単体テスト（8テスト）
- **Controller層**: APIエンドポイントの統合テスト（8テスト）

### 学んだ教訓

#### KEY INSIGHT: fetchモック化のベストプラクティス

```typescript
// 成功レスポンスのモック
mockFetch.mockResolvedValueOnce({
  ok: true,
  status: 200,
  text: async () => 'ok',
} as Response);

// エラーレスポンスのモック
mockFetch.mockResolvedValueOnce({
  ok: false,
  status: 404,
  statusText: 'Not Found',
  text: async () => 'Not Found',
} as Response);
```

#### KEY INSIGHT: PrismaClientのモック化パターン

```typescript
const mockPrismaClient = {
  appUser: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

prismaClientManager = {
  getClient: jest.fn().mockReturnValue(mockPrismaClient),
} as unknown as jest.Mocked<PrismaClientManager>;
```

#### KEY INSIGHT: ClerkJwtGuardのテストオーバーライド

```typescript
.overrideGuard(ClerkJwtGuard)
.useValue({
  canActivate: jest.fn(() => true),
})
```

#### GLOBAL LEARNING: テストファクトリの型安全性確保

```typescript
export class UserSettingsFactory {
  static createUserSettings(overrides?: Partial<UserSettings>): UserSettings {
    return {
      userId: 'user_test123',
      displayName: 'テストユーザー',
      slackWebhookUrl: null,
      notificationEnabled: false,
      updatedAt: new Date(),
      ...overrides,
    };
  }
}
```

### 技術的発見

#### 1. モノレポでのテスト影響範囲管理

- **問題**: スキーマ変更時の既存テストエラー
- **解決**: 全アプリケーションのテストファクトリ一括更新
- **チェックポイント**: `apps/api-backend`, `apps/backend`

#### 2. 非同期処理のテスト

```typescript
// レスポンス時間の検証
expect(result.responseTime).toBeGreaterThanOrEqual(0);
```

#### 3. エラーハンドリングのテストパターン

```typescript
// Prisma P2025エラーのモック
mockPrismaClient.appUser.update.mockRejectedValue(
  new Error('Record not found') as any
);
```

### テストカバレッジ結果

#### 最終テスト数

- **UserSettingsService**: 26テスト
- **UserSettingsRepository**: 8テスト
- **UserSettingsController**: 8テスト
- **合計**: 42テスト（全成功）

#### カバレッジ観点

- **正常系**: 基本機能の動作確認
- **異常系**: エラーハンドリングの検証
- **境界値**: バリデーション限界値のテスト
- **セキュリティ**: 認証・認可の確認

### 残された課題と改善点

#### 1. E2Eテストの追加

- **課題**: API全体の統合テスト不足
- **提案**: Supertest活用のE2Eテスト実装

#### 2. パフォーマンステスト

- **課題**: 大量データでの性能検証不足
- **提案**: 負荷テストシナリオの作成

#### 3. テストデータ管理

- **課題**: テスト間でのデータ独立性確保
- **提案**: テストデータベースの分離

### 関連タスク

- TPC-101: ユーザー設定取得/更新API実装
- 将来タスク: E2Eテスト基盤構築、パフォーマンステスト導入

### メタデータ

- **テストフレームワーク**: Jest
- **モック**: jest.fn(), global.fetch
- **テスト種別**: 単体テスト、統合テスト
- **カバレッジ**: Service, Repository, Controller層

---

## 統計情報機能のテスト戦略 (2025-01-15)

### 背景と課題

ダッシュボード統計情報の累計表示対応で、新しいリポジトリメソッド`findAllByUserIdForStats`を追加。有効期限切れの番組も含める要件により、既存のテストケースでは不十分。

### 検討したテストアプローチ

1. **既存テストの拡張**: 既存のテストケースにパラメーターを追加
2. **専用テストケースの作成**: 統計用メソッド専用のテストスイートを作成
3. **統合テストでの検証**: エンドツーエンドでの統計情報取得をテスト

### 決定事項と理由

**専用テストケースの作成**を採用

**理由:**

- 明確な責任分離: 統計用途と通常用途のテストを分離
- 網羅性: 有効期限切れの番組を含む/含まないケースを明確にテスト
- 保守性: 将来の統計ロジック変更時の影響範囲を限定

### 実装したテストパターン

#### リポジトリレベルのテスト

```typescript
describe('findAllByUserIdForStats', () => {
  it('指定ユーザーの全パーソナルプログラム一覧を取得できること（有効期限切れも含む）', async () => {
    const userId = 'user-1';
    const mockPrograms = [
      PersonalizedProgramFactory.createPersonalizedProgram(),
      PersonalizedProgramFactory.createExpiredPersonalizedProgram(), // 有効期限切れ
    ];

    // モック設定
    mockPrismaClient.personalizedFeedProgram.count.mockResolvedValue(2);
    mockPrismaClient.personalizedFeedProgram.findMany.mockResolvedValue(mockPrograms);

    const result = await repository.findAllByUserIdForStats(userId, options);

    // 有効期限切れの番組も含まれることを検証
    expect(result.programs).toHaveLength(2);
    expect(result.totalCount).toBe(2);
  });
});
```

#### サービスレベルのテスト

```typescript
describe('getDashboardStats', () => {
  it('統計情報を正しく取得できること（有効期限切れの番組も含む）', async () => {
    // 有効期限切れの番組を含むモックデータ
    const mockProgramsResult = {
      programs: [
        createValidProgram(),
        createExpiredProgram(), // 有効期限切れ
      ],
      totalCount: 2,
    };

    personalizedProgramsRepository.findAllByUserIdForStats.mockResolvedValue(mockProgramsResult);

    const result = await service.getDashboardStats(userId);

    // 累計数値が正しく計算されることを検証
    expect(result.totalEpisodesCount).toBe(2); // 有効期限切れも含む
  });
});
```

### 学んだ教訓

1. **KEY INSIGHT**: 統計情報のテストでは、境界条件（有効期限切れ、データなし等）の検証が重要
2. ファクトリクラスで有効期限切れのテストデータを作成することで、テストの可読性が向上
3. 統計用メソッドは通常のCRUD操作とは異なるテスト観点が必要
4. モックデータの設計で、実際のビジネスロジックの複雑さを反映することが重要

### テストカバレッジの観点

- **正常系**: 有効な番組のみ、有効期限切れの番組のみ、混在パターン
- **異常系**: ユーザーが存在しない、番組が0件、データベースエラー
- **境界値**: 大量データ、音声ファイルなしの番組、時間計算の精度

### 関連タスク

- ダッシュボード統計情報の累計表示対応
- PersonalizedProgramFactoryの拡張（有効期限切れデータ対応）

### 今後の改善案

- 統計情報の性能テスト（大量データでの応答時間）
- 統計計算ロジックの単体テスト分離
- 統計情報のキャッシュ機能のテスト戦略

---

## 番組生成履歴API包括テスト戦略 (2024-12-19)

### 背景と課題

番組生成履歴APIの実装において、Repository、Service、Controller各層の包括的なテスト戦略が必要だった。関連データを含む複雑なクエリ、セキュリティ機能、エラーハンドリングを含む多層アーキテクチャのテスト設計。

### 検討したアプローチ

1. **テストデータ管理**
   - 直接記載 vs ファクトリーパターン
   - ファクトリーパターンを採用（プロジェクトルール遵守）
2. **モック戦略**
   - 完全モック vs 部分モック
   - 層ごとに適切なモックレベルを選択
3. **テストケース設計**
   - ハッピーパス中心 vs エラーケース重視
   - 両方をバランス良く実装

### 決定事項と理由

1. **ファクトリーパターン採用**: テストデータの一貫性と保守性向上
2. **層別テスト戦略**: 各層の責任に応じたテスト設計
3. **包括的エラーテスト**: セキュリティとエラーハンドリングの徹底検証
4. **型安全性重視**: TypeScriptの型システムを活用したテスト設計

### 実装パターン

#### 1. Repository層テスト

```typescript
// 関連データ付き取得のテスト
it('should return attempts with feed and program relations', async () => {
  const result = await repository.findByUserIdWithRelationsForDashboard(
    testUserId,
    { limit: 10, offset: 0 }
  );

  expect(result.attempts[0]).toHaveProperty('feed');
  expect(result.attempts[0]).toHaveProperty('program');
});
```

#### 2. Service層テスト

```typescript
// セキュリティテスト
it('should throw NotFoundException for non-existent feedId', async () => {
  await expect(
    service.getProgramGenerationHistory(testUserId, {
      feedId: 'non-existent',
      limit: 10,
      offset: 0,
    })
  ).rejects.toThrow(NotFoundException);
});
```

#### 3. Controller層テスト

```typescript
// 認証とレスポンス形式のテスト
it('should return program generation history', async () => {
  const response = await request(app.getHttpServer())
    .get('/dashboard/program-generation-history')
    .set('Authorization', `Bearer ${validToken}`)
    .expect(200);

  expect(response.body).toHaveProperty('history');
  expect(response.body).toHaveProperty('totalCount');
});
```

### 学んだ教訓

- **ファクトリーパターンの威力**: テストデータの一貫性と保守性が大幅に向上
- **層別責任の明確化**: 各層で何をテストすべきかの明確な分離
- **セキュリティテストの重要性**: 不正アクセスケースの徹底的なテスト
- **型安全性の活用**: TypeScriptの型システムによるテストの信頼性向上

### 関連タスク

TPC-101 ユーザーダッシュボードの実装

---
