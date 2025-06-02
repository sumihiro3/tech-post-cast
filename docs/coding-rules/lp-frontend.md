# Nuxt 3 LPフロントエンド実装ルール

**適用対象**: apps/lp-frontend/**/*

Tech Post Cast LPフロントエンド実装ルール

## フレームワーク・ライブラリ

Nuxt 3 + Vuetify + TypeScript で実装してください
Nuxt設定はnuxt.config.tsに集約し、不要な設定は追加しないでください

## コンポーネント設計

### 基本原則

- ファイル名はPascalCaseで命名してください (例: TopHero.vue)
- コンポーネントはsrc/componentsディレクトリに配置してください
- 関連性のあるコンポーネントはサブディレクトリにまとめてください (例: components/hero/)
- コンポーネントはTypeScriptのSetup Scriptで実装してください
- テンプレートはPugを使用してください
- スタイルはSCSSまたはCSSを使用してください
- Props、Emits、Ref等の型は明示的に指定してください

### 共通コンポーネントの配置と命名規則

- **共通コンポーネント**: `src/components/common/`に配置し、`App`プレフィックスを付けてください
    - 例: `AppSnackbar.vue`, `AppProgress.vue`, `AppHeader.vue`
- **ページ固有コンポーネント**: `src/components/[page-name]/`に配置してください
- **UI部品コンポーネント**: `src/components/ui/`は使用せず、共通コンポーネントまたはページ固有コンポーネントとして配置してください

### コンポーネント分割戦略

- **ページレベル**: フォーム全体とアクションボタンはページレベルで実装し、状態管理を一元化してください
- **UIコンポーネント**: 再利用可能なUIパーツのみを分離し、emit/propsの複雑な連鎖を避けてください
- **適度な分割**: 過度な分割は避け、保守性と再利用性のバランスを考慮してください

### Nuxt 3 自動インポート対応

- コンポーネントの自動インポートを活用し、明示的なインポートは避けてください
- `.nuxt/components.d.ts`で生成される名前を確認し、テンプレートで正しい名前を使用してください
- ディレクトリ構造に基づく命名規則を理解してください（例: `components/dashboard/settings/UserNameSection.vue` → `DashboardSettingsUserNameSection`）

### Vue 3 Composition API 対応

- `emit`は戻り値を返さないため、子コンポーネントから親の非同期関数の結果を直接受け取ることはできません
- 非同期処理の結果が必要な場合は、propsで関数を渡すか、状態を親で管理してください

## スタイリング

- Vuetifyのコンポーネントを優先的に使用してください
- カスタムCSSはscoped属性を付与してください
- 色やサイズなどの変数はVuetifyのテーマ設定を使用してください
- レスポンシブデザインはVuetifyのブレークポイントを使用してください

## 状態管理

### 基本方針

- ページレベルの状態はページコンポーネント内で管理してください
- 複数のコンポーネント間で共有する状態はcomposablesに切り出してください
- APIとの通信はsrc/apiディレクトリに実装してください
- 環境変数はruntimeConfigを介してアクセスしてください

### Composables設計

- **API連携用**: `useXxxApi`形式で命名し、CRUD操作と状態管理を含めてください
- **機能特化型**: `useXxxFeature`形式で特定機能（例: `useSlackWebhookTest`）を実装してください
- **状態管理**: `settings`, `originalSettings`, `loading`, `error`, `hasChanges`などの標準的な状態を含めてください
- **バリデーション**: フロントエンド側でのリアルタイムバリデーション機能を含めてください

### UI状態管理の統一ルール

**必須**: UI状態管理には`useUIState`composableを使用してください

```typescript
// ✅ 推奨: 統一されたUI状態管理
const ui = useUIState();
ui.showLoading({ message: '処理中...' });
ui.showSuccess('保存しました');
ui.showError('エラーが発生しました');

// ❌ 非推奨: 個別のcomposableの直接使用
const snackbar = useSnackbar();
const progress = useProgress();
```

#### UI状態管理のベストプラクティス

1. **統一インターフェイスの使用**
   - `useUIState`を通じてすべてのUI状態を管理してください
   - 個別のcomposable（`useSnackbar`, `useProgress`）の直接使用は避けてください

2. **共通コンポーネントの活用**
   - `AppSnackbar`と`AppProgress`をレイアウトファイルに配置してください
   - これらのコンポーネントは`useUIState`と自動的に連携します

3. **型安全性の確保**
   - すべてのUI状態関連の関数には明示的な戻り値型を指定してください
   - linterエラーは完全に解消してから実装を完了してください

4. **段階的移行**
   - 既存のコードを一度に変更せず、段階的に`useUIState`に移行してください
   - 既存の動作するコードは可能な限り活用してください

## API連携

### 基本設定

- src/apiディレクトリはバックエンドのOpenAPI定義から自動生成されています
- 自動生成されたコードは直接編集せず、必要に応じてラッパーを作成してください
- APIクライアントの初期化と認証トークンの設定はプラグインで行ってください

### エラーハンドリング

- **詳細なエラー情報**: HTTPステータス、サーバーエラーメッセージを含む詳細な情報を表示してください
- **ユーザーフレンドリー**: 技術的なエラーメッセージをユーザーが理解しやすい形に変換してください
- **自動クリア**: 成功時にエラーメッセージを自動的にクリアしてください
- **エラー状態管理**: composablesでエラー状態を適切に管理してください

### APIクライアント更新

- バックエンドのAPI定義更新時は`yarn generate:api-client`を実行してください
- 生成されたAPIクライアントをプラグインに追加してください
- 型定義の変更に合わせてcomposablesを更新してください

## 型定義

- 共通の型定義はsrc/typesディレクトリに配置してください
- ドメイン固有の型定義は適切なサブディレクトリに配置してください (例: types/headline-topic-programs/)
- any型の使用は避け、適切な型を定義してください
- APIレスポンスの型はDtoサフィックスを付けてください
- 自動生成されたAPIの型定義は修正せず、必要に応じてラッパー型を定義してください

### Composableの型定義ルール

1. **戻り値型の明示**

   ```typescript
   // ✅ 推奨: 明示的な戻り値型
   export const useUIState = (): UIStateReturn => {
     // 実装
   };

   // ❌ 非推奨: 型推論に依存
   export const useUIState = () => {
     // 実装
   };
   ```

2. **インターフェイスの定義**

   ```typescript
   interface UIStateReturn {
     showLoading: (options?: LoadingOptions) => void;
     hideLoading: () => void;
     showSuccess: (message: string, options?: MessageOptions) => void;
     // ...
   }
   ```

## Composable設計ルール

### 統一インターフェイスパターン

複数の関連するcomposableがある場合は、統一インターフェイスを提供してください：

```typescript
// 統一インターフェイス
export const useUIState = (): UIStateReturn => {
  const snackbar = useSnackbar(); // 既存composableを活用
  const progress = useProgress();  // 既存composableを活用

  return {
    // 統一されたAPI
    showLoading: (options?: LoadingOptions): void => progress.show(options),
    showSuccess: (message: string, options?: MessageOptions): void =>
      snackbar.showSuccess(message, options),
  };
};
```

### 既存資産活用の原則

1. **段階的統一化**: 既存の動作するcomposableは削除せず、上位レイヤーで統一してください
2. **後方互換性**: 既存のAPIを破壊せずに新しいAPIを提供してください
3. **文書化**: 統一インターフェイスの使用方法をREADMEで明確に説明してください

## フォーム実装

### バリデーション

#### 基本原則

- **リアルタイムバリデーション**: ユーザー入力に対してリアルタイムでフィードバックを提供してください
- **文字数制限**: 制限がある場合は文字数カウンターを表示してください
- **URL形式チェック**: URLフィールドでは適切な形式チェックを実装してください
- **条件付きバリデーション**: 他のフィールドの状態に応じたバリデーションを実装してください

#### リアルタイムバリデーション実装パターン

**必須**: バリデーション機能には階層化されたモジュラー設計を採用してください

```typescript
// ✅ 推奨: 階層化バリデーション設計
// レイヤー1: 純粋なバリデーション関数（utils/validation/）
export const validateTagsFilter = (tags: string[], maxTags: number = 10): FieldValidationResult => {
  // ビジネスロジック
};

// レイヤー2: リアクティブ状態管理（composables/validation/）
export const useFeedValidation = (
  feedData: Ref<InputPersonalizedFeedData>,
  options: ValidationOptions = {}
): FeedValidationReturn => {
  // Vue固有のリアクティブ処理
};

// レイヤー3: UI統合（コンポーネント内）
const { validationResult, isValid, getFieldErrors } = useFeedValidation(feedData, {
  realtime: true,
  debounceDelay: 500,
  maxTags: props.maxTags,
  maxAuthors: props.maxAuthors,
});
```

#### バリデーション設計ガイドライン

1. **デバウンス時間の最適化**
   - **推奨値**: 500ms（ユーザーの入力速度とフィードバックの即時性のバランス）
   - 短すぎる（200ms以下）: パフォーマンス低下
   - 長すぎる（1000ms以上）: ユーザー体験の悪化

2. **エラーと警告の分離**

   ```typescript
   interface FieldValidationResult {
     isValid: boolean;
     errors: string[];    // 送信を阻害する問題
     warnings: string[];  // 推奨設定からの逸脱
   }
   ```

3. **プラン別制限値の動的対応**

   ```typescript
   // ✅ 推奨: 外部から制限値を注入
   const { validationResult } = useFeedValidation(feedData, {
     maxTags: props.maxTags,      // プランにより変動
     maxAuthors: props.maxAuthors, // プランにより変動
   });

   // ❌ 非推奨: ハードコードされた制限値
   const maxTags = 10; // 固定値
   ```

4. **既存機能との統合**

   ```typescript
   // 新しいバリデーションと既存のエラーハンドリングを統合
   const getFieldErrors = (field: string): string[] => {
     const validationErrors = getValidationFieldErrors(field);
     const propsErrors = props.fieldErrors[field] || [];
     return [...validationErrors, ...propsErrors];
   };
   ```

#### バリデーション実装のベストプラクティス

1. **関心の分離**
   - バリデーションロジック: `utils/validation/`
   - リアクティブ状態管理: `composables/validation/`
   - UI統合: コンポーネント内

2. **再利用性の確保**
   - 各バリデーション関数は独立してテスト可能
   - 他のフォーム画面でも同じパターンを適用可能

3. **段階的導入**
   - 既存のpropsとの互換性を保持
   - 新機能をオプショナルにして段階的に導入

4. **Vue 3での変数宣言順序**

   ```typescript
   // ✅ 推奨: computed内で参照される変数は事前に宣言
   const filteredQiitaPosts = ref([]);
   const feedData = computed(() => ({
     // filteredQiitaPosts.valueを参照
   }));

   // ❌ 非推奨: 初期化前の参照
   const feedData = computed(() => ({
     // filteredQiitaPosts.valueを参照
   }));
   const filteredQiitaPosts = ref([]); // エラー: 初期化前にアクセス
   ```

#### エラーハンドリング強化パターン

```typescript
// 強化されたエラーハンドリングの実装例
const { handleError, isRecoverable } = useEnhancedErrorHandler();

// リトライ機能付きAPI呼び出し
const { execute, isRetrying, retryCount } = useRetryableApiCall();

// 段階的ローディング表示
const { startStep, completeStep, showProgress } = useProgressiveLoading();
```

#### バリデーション機能の拡張計画

1. **他フォーム画面への適用**: 同じアーキテクチャパターンを他の画面に展開
2. **バリデーションルールの外部化**: 設定ファイルや管理画面からのルール変更
3. **国際化対応**: エラーメッセージの多言語対応
4. **パフォーマンス最適化**: バリデーション処理の最適化

### 状態管理

- **変更検知**: 未保存の変更を検知し、適切にボタンの有効/無効を制御してください
- **リセット機能**: 最後に保存された状態に戻すリセット機能を提供してください
- **自動保存**: 必要に応じて自動保存機能を検討してください

## UI/UX設計

### レスポンシブデザイン

- モバイルファースト設計を採用してください
- Vuetifyのブレークポイント（xs, sm, md, lg, xl）を活用してください
- ボタン配置やフォームレイアウトをデバイスサイズに応じて最適化してください

### アクセシビリティ

- キーボード操作で全機能にアクセス可能にしてください
- 適切なaria-label、aria-describedbyを設定してください
- 色覚対応として、色以外の情報でも状態を判別可能にしてください
- スクリーンリーダー対応を考慮してください

### ユーザビリティ

- **保存ボタン位置**: フォーム下部など、ユーザーが期待する位置に配置してください
- **フィードバック**: 操作結果を明確にユーザーに伝えてください
- **プログレス表示**: 長時間の処理では適切なローディング表示を行ってください

### 条件付きUI表示

#### データ量に応じた適応的UI

データの量や状況に応じてUIを動的に制御し、不要な要素を非表示にしてユーザビリティを向上させる：

```typescript
// フィルター表示の条件付き制御例
const shouldShowFilter = computed(() => {
  return personalizedFeeds.value.length >= 2;
});
```

```vue
<!-- テンプレートでの条件付き表示 -->
<v-select
  v-if="shouldShowFilter"
  v-model="selectedFeedId"
  :items="feedOptions"
  label="フィード"
  clearable
  variant="outlined"
  density="compact"
/>
```

#### 状態に応じた視認性制御

リソースの状態（期限切れ、非アクティブ等）に応じて適切な視覚的フィードバックを提供する：

```typescript
// 期限切れ番組の表示制御
const getProgramDisplayProps = (program: ProgramDto | null) => {
  if (!program) return null;

  return {
    text: program.title,
    color: program.isExpired ? 'grey' : 'black',
    size: 'default', // 読みやすさを優先
    textTransform: 'none', // 日本語の場合は大文字変換を無効
  };
};
```

### テーブル設計ベストプラクティス

#### 列の配置とレイアウト

- **数値データ**: 右端に配置し、右寄せで表示
- **アクションリンク**: 主要な情報（番組名）に配置
- **ステータス表示**: v-chipを使用した視覚的な表現
- **日時表示**: 統一されたフォーマット関数を使用

```typescript
// テーブル列定義の例
const headers = [
  { title: '実行日時', key: 'executedAt', sortable: false },
  { title: 'フィード', key: 'feed', sortable: false },
  { title: 'ステータス', key: 'status', sortable: false },
  { title: '理由', key: 'reason', sortable: false },
  { title: '記事数', key: 'articlesCount', sortable: false, align: 'end' },
  { title: '番組', key: 'program', sortable: false },
];
```

#### 空状態とローディング状態

適切な空状態とローディング状態を提供し、ユーザーに現在の状況を明確に伝える：

```vue
<template>
  <v-data-table
    :headers="headers"
    :items="history"
    :loading="loading"
    loading-text="履歴を読み込み中..."
    no-data-text="番組生成履歴がありません"
  >
    <!-- テーブル内容 -->
  </v-data-table>
</template>
```

### 日本語化とローカライゼーション

#### エラーメッセージの日本語化

技術的なエラーコードも含めて、すべてのメッセージを日本語化する：

```typescript
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'SUCCESS': '成功',
    'FAILED': '失敗',
    'IN_PROGRESS': '実行中',
    'CANCELLED': 'キャンセル',
    'TIMEOUT': 'タイムアウト',
    'INSUFFICIENT_ARTICLES': '記事不足',
    'GENERATION_ERROR': '生成エラー',
  };
  return statusMap[status] || status;
};
```

#### 直感的なナビゲーション

関連リソースへの効率的なアクセスを提供する：

```vue
<!-- フィード名にリンクを追加 -->
<template #item.feed="{ item }">
  <nuxt-link
    :to="`/dashboard/personalized-feeds/${item.feed.id}`"
    class="text-decoration-none"
  >
    {{ item.feed.name }}
  </nuxt-link>
</template>
```

### レスポンシブデザイン考慮事項

#### モバイル対応

テーブルコンポーネントでモバイル表示を考慮した設計を行う：

```vue
<v-data-table
  :headers="headers"
  :items="history"
  :mobile-breakpoint="0"
  class="elevation-1"
>
  <!-- モバイル表示用のカスタマイズ -->
</v-data-table>
```

### パフォーマンス最適化

#### ページネーション実装

大量データの効率的な表示のためのページネーション：

```vue
<v-pagination
  v-if="totalPages > 1"
  v-model="currentPage"
  :length="totalPages"
  :total-visible="7"
  class="mt-4"
/>
```

#### 条件付きレンダリング

不要な要素の描画を避けるための条件付きレンダリング：

```vue
<template #item.program="{ item }">
  <div v-if="item.program" class="d-flex align-center justify-end">
    <!-- 番組情報の表示 -->
  </div>
  <span v-else class="text-grey text-right">-</span>
</template>
```

## パフォーマンス最適化

- 大きなコンポーネントは適切に分割してください
- 画像は最適化してから使用してください
- 不要なレンダリングを避けるためにv-memoやv-onceを活用してください
- ルートごとに適切なレンダリング戦略を使用してください (SSG, SSR, CSR)

## テスト

### テスト戦略

- 新機能追加時はユニットテストを作成してください
- コンポーネントのロジックはできるだけcomposablesに分離し、テスト可能にしてください
- **テストデータ**: 必ずファクトリクラスから取得してください（統一テスト戦略に準拠）

### テスト対象

- **Composables**: API連携、状態管理、バリデーション機能
- **コンポーネント**: ユーザーインタラクション、プロパティ変更時の動作
- **統合テスト**: フォーム送信、画面遷移、API連携

## デバッグ・トラブルシューティング

### よくある問題と解決方法

1. **コンポーネントが見つからないエラー**
   - `.nuxt/components.d.ts`で自動生成された名前を確認
   - ディレクトリ構造に基づく命名規則を確認

2. **emit関数の戻り値エラー**
   - Vue 3では`emit`は戻り値を返さない
   - 非同期処理の結果が必要な場合はpropsで関数を渡す

3. **APIクライアントの型エラー**
   - `yarn generate:api-client`でクライアントを再生成
   - バックエンドのAPI定義との整合性を確認

4. **バリデーションエラー**
   - フロントエンドとバックエンドのバリデーション仕様を統一
   - 空文字やnullの扱いを明確に定義

## アクセシビリティ

- セマンティックなHTMLを使用してください
- 適切なARIAロールと属性を使用してください
- コントラスト比を考慮した色設計を行ってください
- キーボード操作に対応してください

## SEO対策

- 各ページには適切なtitle, description, OGP設定を含めてください
- 構造化データを適切に設定してください
- 画像にはalt属性を設定してください

## リンター・フォーマッター

- ESLintのルールにしたがってコードを記述してください
- コードフォーマットはnpm run formatコマンドで整形してください
- コミット前に必ずlintチェックを実行してください

## 実装例・ベストプラクティス

### ユーザー設定画面の実装例

今回実装したユーザー設定画面（`pages/app/settings.vue`）は、以下のベストプラクティスを実装しています：

- **適度なコンポーネント分割**: UIコンポーネントのみ分離し、状態管理はページレベルで一元化
- **詳細なエラーハンドリング**: HTTPステータスとサーバーメッセージを含む詳細な情報表示
- **リアルタイムバリデーション**: ユーザー入力に対する即座のフィードバック
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **アクセシビリティ対応**: キーボード操作とスクリーンリーダー対応

この実装を参考に、他の画面でも同様の品質を保ってください。

### パーソナルフィード管理画面のバリデーション実装例

パーソナルフィード管理画面（`pages/app/feeds/create.vue`, `pages/app/feeds/edit.vue`）では、以下の高度なバリデーション機能を実装しています：

#### 1. 階層化バリデーション設計

```typescript
// utils/validation/feed-validation.ts - ビジネスロジック層
export const validateTagsFilter = (tags: string[], maxTags: number = 10): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (tags.length > maxTags) {
    errors.push(`タグは${maxTags}個以下で設定してください`);
  }

  if (tags.length > 5) {
    warnings.push('タグが多すぎると、記事が見つからない可能性があります');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// composables/validation/useFeedValidation.ts - リアクティブ状態管理層
export const useFeedValidation = (
  feedData: Ref<InputPersonalizedFeedData>,
  options: ValidationOptions = {}
): FeedValidationReturn => {
  const validationResult = ref<ValidationResult>({ isValid: true, errors: {}, warnings: {} });

  const debouncedValidate = useDebounceFn(() => {
    validationResult.value = validateFeedData(feedData.value, options);
  }, options.debounceDelay || 500);

  if (options.realtime) {
    watch(feedData, debouncedValidate, { deep: true });
  }

  return { validationResult, isValid, getFieldErrors };
};
```

#### 2. プラン別制限値の動的対応

```typescript
// コンポーネント内での使用例
const props = defineProps<{
  maxTags?: number;    // プランにより変動（フリー: 3, ベーシック: 10, プレミアム: 20）
  maxAuthors?: number; // プランにより変動（フリー: 2, ベーシック: 5, プレミアム: 10）
}>();

const { validationResult, isValid, getFieldErrors } = useFeedValidation(feedData, {
  realtime: true,
  debounceDelay: 500,
  maxTags: props.maxTags || 10,
  maxAuthors: props.maxAuthors || 10,
});
```

#### 3. エラーと警告の統合表示

```vue
<template>
  <v-text-field
    v-model="feedData.title"
    :error-messages="getFieldErrors('title')"
    :color="getFieldWarnings('title').length > 0 ? 'warning' : undefined"
  />

  <!-- 警告メッセージの表示 -->
  <v-alert
    v-if="getFieldWarnings('title').length > 0"
    type="warning"
    variant="tonal"
    class="mt-2"
  >
    {{ getFieldWarnings('title').join(', ') }}
  </v-alert>
</template>
```

#### 4. Vue 3での変数宣言順序対応

```typescript
// ✅ 正しい実装: 依存関係を考慮した宣言順序
const filteredQiitaPosts = ref<QiitaPost[]>([]);
const filteredQiitaPostsTotalCount = ref(0);

const feedData = computed(() => ({
  title: title.value,
  filterGroups: [{
    tagFilters: selectedTags.value,
    authorFilters: selectedAuthors.value,
    // filteredQiitaPosts.valueを安全に参照
    posts: filteredQiitaPosts.value,
  }],
}));
```

#### 5. 既存機能との統合

```typescript
// 新しいバリデーションと既存のエラーハンドリングを統合
const getFieldErrors = (field: string): string[] => {
  const validationErrors = getValidationFieldErrors(field);
  const propsErrors = props.fieldErrors[field] || [];
  return [...validationErrors, ...propsErrors];
};
```

#### 実装のポイント

1. **デバウンス時間**: 500msでユーザー体験とパフォーマンスのバランスを実現
2. **エラーと警告の分離**: 送信阻害エラーと推奨事項警告を明確に区別
3. **プラン別制限**: ビジネス要件に応じた動的制限値対応
4. **段階的導入**: 既存機能を破壊せずに新機能を追加
5. **再利用性**: 他のフォーム画面でも同じパターンを適用可能

この実装パターンを参考に、他のフォーム画面でも同様の高品質なバリデーション機能を実装してください。
