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
