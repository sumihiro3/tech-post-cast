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
- 各アプリケーション種別ごとのコーディングガイドラインは `/docs/coding-rules/` ディレクトリを参照してください。

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
│   ├── commons/         # 共通ユーティリティと機能
│   ├── eslint-config/   # ESLint設定
│   ├── tsconfig/        # TypeScript設定
│   └── ui-components/   # 共有UIコンポーネント
└── docs/                # プロジェクトドキュメント
    └── coding-rules/    # 詳細なコーディングルール
```

## Git管理

- コミットメッセージは具体的に記述し、関連するチケット番号を含めてください。
- ブランチ名は `feature/XXX`、`fix/XXX`、`refactor/XXX` などの命名規則にしたがってください。
- 機能開発はfeatureブランチで行い、完成したらPull Requestを作成してください。
- コードレビュープロセスを経てからマージしてください。

## テスト

- 新しい機能を追加する場合は、対応するテストも追加してください。
- **テストデータは必ずファクトリクラスから取得してください**（NestJSアプリケーション）
- テストカバレッジを維持するように努めてください。
- テストは自動化され、CI/CDパイプラインに組み込まれています。
- 詳細なテスト戦略については `/docs/coding-rules/common.md#統一テスト戦略` を参照してください。

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

- 共有パッケージ（commons, database等）の詳細な利用ガイドラインは `/docs/coding-rules/common.md#共有コードとパッケージの使用ガイドライン` を参照してください。

## 統一インターフェイス設計原則

### 段階的統一化パターン

複数の関連する機能やcomposableが存在する場合は、段階的統一化パターンを適用してください：

```typescript
// ✅ 推奨: 段階的統一化パターン
export const useUnifiedInterface = (): UnifiedReturn => {
  const existingFeatureA = useExistingFeatureA(); // 既存機能を活用
  const existingFeatureB = useExistingFeatureB(); // 既存機能を活用

  return {
    // 統一されたAPI
    doSomething: (options: Options): void => existingFeatureA.execute(options),
    doAnother: (data: Data): void => existingFeatureB.process(data),
  };
};

// ❌ 非推奨: 既存機能の完全置き換え
export const useNewInterface = (): NewReturn => {
  // 既存の動作するコードを破棄して新規実装
};
```

### 既存資産活用の原則

1. **動作するコードの価値**: 既存の動作するコードは貴重な資産として最大限活用してください
2. **上位レイヤーでの統一**: 下位の実装を変更せず、上位レイヤーで統一インターフェイスを提供してください
3. **後方互換性の維持**: 既存のAPIを破壊せずに新しいAPIを提供してください
4. **段階的移行**: 一度にすべてを変更せず、段階的に新しいインターフェイスに移行してください

### 統一インターフェイスの設計ガイドライン

1. **明確な責任分離**: 統一インターフェイスは複数の関連機能を束ねるが、各機能の責任は明確に分離してください
2. **型安全性の確保**: すべての関数に明示的な戻り値型を指定してください
3. **文書化の徹底**: 統一インターフェイスの使用方法をREADMEで明確に説明してください
4. **テスト可能性**: 統一インターフェイスもテスト可能な設計にしてください

## バリデーション機能の共通設計原則

### モジュラー設計パターン

バリデーション機能は以下の階層化されたモジュラー設計を採用してください：

```typescript
// レイヤー1: 純粋なバリデーション関数（ビジネスロジック）
// 場所: utils/validation/
export const validateField = (value: string, options: ValidationOptions): FieldValidationResult => {
  // フレームワークに依存しない純粋なロジック
};

// レイヤー2: リアクティブ状態管理（フレームワーク固有）
// 場所: composables/validation/
export const useValidation = (data: Ref<Data>, options: Options): ValidationReturn => {
  // Vue/React等のリアクティブシステムとの統合
};

// レイヤー3: UI統合（コンポーネント固有）
// 場所: コンポーネント内
const { validationResult, isValid } = useValidation(formData, validationOptions);
```

### バリデーション設計の共通ルール

1. **エラーと警告の分離**

   ```typescript
   interface FieldValidationResult {
     isValid: boolean;
     errors: string[];    // 送信を阻害する問題
     warnings: string[];  // 推奨設定からの逸脱
   }
   ```

2. **設定の外部化**

   ```typescript
   // ✅ 推奨: 設定値を外部から注入
   const validation = useValidation(data, {
     maxItems: props.maxItems,  // プランや環境により変動
     debounceDelay: 500,        // パフォーマンス調整可能
   });

   // ❌ 非推奨: ハードコードされた設定
   const maxItems = 10; // 固定値
   ```

3. **デバウンス時間の標準化**
   - **推奨値**: 500ms（ユーザー体験とパフォーマンスのバランス）
   - リアルタイムバリデーションでは必ずデバウンス機能を実装してください

4. **既存機能との統合**

   ```typescript
   // 新しいバリデーションと既存のエラーハンドリングを統合
   const getFieldErrors = (field: string): string[] => {
     const validationErrors = getValidationFieldErrors(field);
     const existingErrors = props.fieldErrors[field] || [];
     return [...validationErrors, ...existingErrors];
   };
   ```

### バリデーション実装のベストプラクティス

1. **関心の分離**: バリデーションロジック、状態管理、UI統合を明確に分離
2. **再利用性**: 各バリデーション関数は独立してテスト・再利用可能
3. **段階的導入**: 既存システムとの互換性を保ちながら段階的に導入
4. **テスタビリティ**: 各レイヤーを独立してテスト可能な設計

## 型安全性とlinter管理

### TypeScript型定義ルール

1. **明示的な戻り値型**: すべての関数に明示的な戻り値型を指定してください

   ```typescript
   // ✅ 推奨
   export const useFeature = (): FeatureReturn => {
     // 実装
   };

   // ❌ 非推奨
   export const useFeature = () => {
     // 実装
   };
   ```

2. **インターフェイスの定義**: 複雑な戻り値型はインターフェイスとして定義してください

   ```typescript
   interface FeatureReturn {
     execute: (options?: ExecuteOptions) => void;
     reset: () => void;
     state: Ref<FeatureState>;
   }
   ```

### Linterエラー管理ルール

1. **完全解消の原則**: 実装完了前にすべてのlinterエラーを解消してください
2. **3回ルール**: 同一ファイルでのlinterエラー修正は3回まで。3回目で解消できない場合は設計を見直してください
3. **エラー分類**: linterエラーは以下のように分類して対処してください
   - **型エラー**: 明示的な型定義で解決
   - **未使用変数**: 不要な変数の削除または`_`プレフィックス
   - **命名規則**: プロジェクトの命名規則に準拠

## 知識管理とドキュメント

### 振り返りと学習の記録

重要な実装や設計決定については、以下の場所に記録してください：

1. **`.cursor/memory/`**: 技術的な学びや設計決定の記録
   - `ui-ux-learnings.md`: UI/UX設計の知見
   - `architecture-decisions.md`: アーキテクチャ決定の記録
   - その他カテゴリ別ファイル

2. **`docs/coding-rules/`**: コーディングルールの更新
   - 新しいパターンやベストプラクティスの追加
   - 既存ルールの改善や明確化

### ドキュメント管理ルール

1. **READMEの配置**: 各重要なディレクトリにREADME.mdを配置してください
2. **使用例の提供**: 抽象的な説明だけでなく、具体的な使用例を含めてください
3. **更新の責任**: コードを変更した際は、関連するドキュメントも同時に更新してください
4. **アーキテクチャ図**: 複雑な設計については、図解を含めてください
