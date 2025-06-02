# コーディングルールの改善記録

## Repository インターフェイス分離ルールの明文化 (2025-01-26)

### 背景と課題

ダッシュボード表示用API実装において、当初Repositoryクラスを直接参照する実装が行われ、依存性逆転の原則に反する設計となった。既存のコーディングガイドラインでは、この重要なアーキテクチャ原則が明確に記載されていなかった。

### 発見された齟齬

1. **Repository インターフェイス分離の原則**が明記されていない
2. **テストファクトリクラスの必須使用**が明確でない
3. **Cursor AI が参照するルールファイル**の配置が不適切

### 実施した改善

#### 1. コーディングガイドラインの更新

**ファイル**: `CODING_GUIDELINES.md`, `docs/coding-rules/api-backend.md`

**追加内容**:

- Repository パターンでのインターフェイス分離の必須化
- テストファクトリクラスの必須使用
- 依存性逆転の原則の明確化

```markdown
## アーキテクチャ原則

### 依存性逆転の原則（NestJSアプリケーション）

- **Repositoryパターン**: データアクセス層は必ずインターフェイスを定義し、ドメイン層とインフラ層を分離する
  - ドメイン層: `src/domains/{domain-name}/{domain-name}.repository.interface.ts`
  - インフラ層: `src/infrastructure/database/{domain-name}/{domain-name}.repository.ts`
  - サービス層: インターフェイスに依存し、DIコンテナーで実装クラスを注入
```

#### 2. Cursor ルールファイルの現代化

**変更**: `.cursorrules` → `.cursor/rules/nestjs-backends.mdc`

**理由**:

- `.cursorrules`ファイルが2025年時点で非推奨
- `.cursor/rules/`ディレクトリでの`.mdc`ファイル管理が現在の標準
- `apps/api-backend`と`apps/backend`の両方に適用されるよう対象範囲を拡張

**更新内容**:

```markdown
# NestJSバックエンド実装ルール

**適用対象**: apps/api-backend/**/* apps/backend/**/*

#### 🚨 重要なアーキテクチャ原則（必須）

- **Repositoryパターン**: Repositoryクラスは必ずインターフェイスを定義し、ドメイン層とインフラ層を分離する
- **テストデータ管理**: テストデータは必ずファクトリクラスから取得する
```

#### 3. アーキテクチャルールファイルの作成

**新規作成**: `ARCHITECTURE_RULES.md`

**目的**: プロジェクトルートに重要なアーキテクチャルールを簡潔にまとめ、迅速な参照を可能にする

### 学んだ教訓

- **KEY INSIGHT**: 重要なアーキテクチャ原則は複数の場所（ガイドライン、Cursorルール、クイックリファレンス）で明記すべき
- Cursor AI のルール管理方式の変化に対応し、定期的にルールファイルの形式を見直す必要がある
- 齟齬が発生した場合は、即座にルールを明文化し、将来の同様の問題を防ぐ

### 効果測定

- **即座の効果**: 今後のRepository実装で自動的にインターフェイス分離が適用される
- **長期的効果**: プロジェクト全体でのアーキテクチャ一貫性の向上
- **チーム効果**: 新規参加者への明確なガイドライン提供

### 関連タスク

- ダッシュボード表示用API実装
- コーディングガイドライン改善
- Cursor ルールファイル現代化

---

## テストファクトリクラス必須化ルールの確立 (2025-01-26)

### 背景と課題

テスト実装において、当初テストファイル内で直接モックデータを作成していたが、これによりテストデータの重複や一貫性の問題が発生した。既存のガイドラインでは「テストデータは必ずファクトリクラスから取得する」という重要なルールが明確でなかった。

### 実施した改善

#### 1. テストファクトリクラスのベストプラクティス確立

**場所**: `docs/coding-rules/api-backend.md`

**追加内容**:

```markdown
#### テストデータ管理（必須）

- **ファクトリクラスの使用**: テストデータは必ずファクトリクラスから取得する
  - 場所: `src/test/factories/{domain-name}.factory.ts`
  - 命名規則: `{DomainName}Factory`
  - インデックスファイル: `src/test/factories/index.ts` でエクスポート管理
```

#### 2. 設計パターンの標準化

**確立したパターン**:

1. **基本メソッド**: `create{EntityName}(overrides = {})`
2. **複数作成**: `create{EntityName}s(count, overrides = {})`
3. **特定用途**: `create{SpecificCase}{EntityName}(overrides = {})`
4. **overrides パターン**: `Partial<T>`型での上書き可能設計

#### 3. 実装例の提供

```typescript
export class UserFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'test-user-id',
      name: 'テストユーザー',
      email: 'test@example.com',
      ...overrides,
    };
  }

  static createUsers(count: number, overrides = {}): User[] {
    return Array.from({ length: count }, (_, index) =>
      this.createUser({
        id: `test-user-id-${index + 1}`,
        ...overrides,
      }),
    );
  }
}
```

### 学んだ教訓

- **KEY INSIGHT**: テストファクトリクラスは単なる推奨事項ではなく、必須の実装パターンとして位置づけるべき
- overrides パターンにより、デフォルト値と個別カスタマイズの両立が可能
- インデックスファイルによる統一管理で、import 文の簡潔化が実現
- 特定用途向けメソッド（expired、inactive等）により、テストシナリオの表現力が向上

### 関連タスク

- PersonalizedProgramFactory 作成
- PersonalizedFeedFactory 作成
- 既存テストのファクトリクラス移行

---
