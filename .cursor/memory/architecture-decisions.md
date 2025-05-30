# アーキテクチャ設計の決定と理由

## Repository インターフェイス分離の原則適用 (2025-01-26)

### 背景と課題

ダッシュボード表示用API実装において、当初`PersonalizedFeedsService`が`PersonalizedProgramsRepository`クラスを直接参照する実装が行われていた。これは依存性逆転の原則に反し、テスタビリティとメンテナンス性を損なう設計であった。

### 検討したアプローチ

1. **直接参照の継続**: 既存の実装を維持し、Repositoryクラスを直接注入
   - 利点: 実装が簡単、変更が最小限
   - 欠点: 依存性逆転の原則に反する、テストが困難、将来の変更に脆弱

2. **インターフェイス分離の適用**: ドメイン層にインターフェイスを定義し、インフラ層で実装
   - 利点: クリーンアーキテクチャに準拠、テスタビリティ向上、依存関係の明確化
   - 欠点: 初期実装コストが高い、ファイル数の増加

### 決定事項と理由

**インターフェイス分離の原則を適用**することを決定。以下の理由による：

- **クリーンアーキテクチャの維持**: ドメイン層がインフラ層に依存しない設計
- **テスタビリティの向上**: モックオブジェクトの作成が容易
- **将来の拡張性**: データアクセス層の実装変更が容易
- **一貫性の確保**: プロジェクト全体でのアーキテクチャ統一

### 実装詳細

```typescript
// ドメイン層インターフェイス
// src/domains/personalized-programs/personalized-programs.repository.interface.ts
export interface IPersonalizedProgramsRepository {
  findByUserIdWithPagination(userId: string, options: PaginationOptions): Promise<PaginatedResult>;
  findById(id: string): Promise<PersonalizedFeedProgramWithDetails | null>;
}

// インフラ層実装
// src/infrastructure/database/personalized-programs/personalized-programs.repository.ts
@Injectable()
export class PersonalizedProgramsRepository implements IPersonalizedProgramsRepository {
  // 実装
}

// DI設定
providers: [
  {
    provide: 'PersonalizedProgramsRepository',
    useClass: PersonalizedProgramsRepository,
  },
]
```

### 学んだ教訓

- **KEY INSIGHT**: Repository パターンでは必ずインターフェイスを定義し、依存性逆転の原則を適用すべき
- 型定義の共有は`packages/database/src/types/`で行い、アプリケーション間での一貫性を保つ
- DIコンテナーでの文字列ベースの注入は、タイプセーフティを保つため慎重に行う

### 関連タスク

- ダッシュボード表示用API実装
- PersonalizedProgramsRepository のインターフェイス分離

---

## Prisma型定義の共有戦略 (2025-01-26)

### 背景と課題

複雑なPrisma型（リレーション含む）を複数のアプリケーション間で共有する必要があった。各アプリケーションで個別に型定義を行うと、一貫性の問題とメンテナンスコストの増大が懸念された。

### 検討したアプローチ

1. **各アプリケーションで個別定義**: アプリケーションごとに必要な型を定義
   - 利点: アプリケーション固有の最適化が可能
   - 欠点: 重複コード、一貫性の問題、メンテナンスコスト増大

2. **共有パッケージでの型定義**: `packages/database/src/types/`で統一管理
   - 利点: 一貫性の確保、重複排除、メンテナンス性向上
   - 欠点: 依存関係の複雑化、型の汎用性要求

### 決定事項と理由

**共有パッケージでの型定義**を採用。以下の実装パターンを確立：

```typescript
// packages/database/src/types/personalized-feed-programs.ts
import { Prisma } from '@prisma/client';

const personalizedFeedProgramWithDetailsValidator = Prisma.validator<Prisma.PersonalizedFeedProgramDefaultArgs>()({
  include: {
    feed: {
      select: {
        id: true,
        name: true,
        userId: true,
      },
    },
    posts: {
      select: {
        id: true,
        title: true,
        url: true,
        authorName: true,
        likesCount: true,
        tags: true,
        createdAt: true,
        // bodyフィールドは除外（egress節約）
      },
    },
  },
});

export type PersonalizedFeedProgramWithDetails = Prisma.PersonalizedFeedProgramGetPayload<
  typeof personalizedFeedProgramWithDetailsValidator
>;
```

### 学んだ教訓

- **KEY INSIGHT**: Prismaバリデーターを使用することで、型安全性を保ちながら共有型を定義できる
- egressコスト削減のため、不要なフィールド（とくにbodyなど大容量フィールド）は明示的に除外する
- 共有型は汎用性と特定用途のバランスを考慮して設計する

### 関連タスク

- PersonalizedFeedProgramWithDetails型の定義
- データベース型の共有パッケージ化

---

## 共通UIコンポーネントアーキテクチャの決定 (2024-12-19)

### 背景と課題

lp-frontendアプリケーションにおいて、UI状態管理が分散し、以下の問題が発生していた：

- `useSnackbar`、`useProgress`、個別UIコンポーネントが混在
- 開発者が複数のAPIを覚える必要がある
- UI表示の一貫性が保たれない
- コードの重複とメンテナンス性の低下

### 検討したアーキテクチャオプション

#### オプション1: モノリシック統一アプローチ

```
useUIState (新規)
├── 独自のSnackbar実装
├── 独自のProgress実装
└── 独自の状態管理
```

- **利点**: 完全に統一されたAPI、シンプルな依存関係
- **欠点**: 既存の動作するコードを破棄、開発コストが高い、リスクが大きい

#### オプション2: レイヤード統一アーキテクチャ（採用）

```
useUIState (統一インターフェース)
├── useSnackbar (既存活用)
├── useProgress (既存活用)
└── 統一されたAPI提供

AppSnackbar ←→ useUIState ←→ AppProgress
    ↓              ↓              ↓
useSnackbar   統一API      useProgress
```

- **利点**: 既存資産活用、段階的移行、リスク最小化
- **欠点**: 一時的な複雑性、間接的な依存関係

#### オプション3: マイクロパッケージアーキテクチャ

```
packages/ui-components/
├── useUIState
├── LoadingSpinner
├── ErrorMessage
└── SuccessMessage
```

- **利点**: 完全な分離、再利用性、独立したバージョニング
- **欠点**: 依存関係の複雑化、ビルド設定の複雑化、モノレポでの管理コスト

### 決定事項と理由

**採用アーキテクチャ**: レイヤード統一アーキテクチャ

**決定理由:**

1. **既存資産の最大活用**: `useSnackbar`と`useProgress`は十分に機能し、SSR対応やVuetify連携も完了
2. **段階的移行**: 既存コードを破壊せずに、新しいAPIを段階的に導入可能
3. **開発効率**: 新規開発コストを最小化し、短期間で統一化を実現
4. **リスク管理**: 既存の動作するコードを保持することで、回帰リスクを最小化

### 実装詳細

#### コンポーネント配置戦略

```
src/components/
├── common/              # 共通コンポーネント（採用）
│   ├── AppSnackbar.vue # グローバルSnackbar
│   ├── AppProgress.vue # グローバルProgress
│   └── README.md       # 使用方法ドキュメント
└── ui/                 # 個別UIコンポーネント（廃止）
```

#### Composable階層設計

```typescript
// 上位レイヤー: 統一インターフェース
export const useUIState = (): UIStateReturn => {
  const snackbar = useSnackbar(); // 下位レイヤー活用
  const progress = useProgress();  // 下位レイヤー活用

  return {
    // 統一されたAPI
    showLoading: (options: LoadingOptions) => progress.show(options),
    showSuccess: (message: string, options?: MessageOptions) =>
      snackbar.showSuccess(message, options),
    // ...
  };
};

// 下位レイヤー: 既存実装（保持）
export const useSnackbar = () => { /* 既存実装 */ };
export const useProgress = () => { /* 既存実装 */ };
```

### 学んだ教訓

#### GLOBAL LEARNING: レイヤードアーキテクチャの有効性

- **段階的移行**: 既存システムを段階的に改善する際の有効なパターン
- **既存資産活用**: 動作するコードは貴重な資産として最大限活用すべき
- **抽象化レイヤー**: 上位レイヤーでの統一により、下位実装の詳細を隠蔽可能

#### 設計原則の確立

1. **後方互換性**: 既存のAPIを破壊せずに新しいAPIを提供
2. **段階的移行**: 一度にすべてを変更せず、段階的に移行
3. **文書化**: READMEによる明確な使用方法の提示

### 今後の拡張計画

#### Phase 1: 基本統一化（完了）

- `useUIState`の実装
- `AppSnackbar`、`AppProgress`の統合
- 基本的なメッセージ表示とローディング機能

#### Phase 2: 機能拡張（計画中）

- モーダル管理の統合
- サイドバー状態管理の統合
- トースト通知の統合

#### Phase 3: 高度な機能（将来）

- アニメーション統一
- テーマ対応
- アクセシビリティ強化

### 関連タスク

- TPC-101: ユーザーダッシュボードの実装
- 共通UIコンポーネントの統一化

### 影響範囲

- **直接影響**: lp-frontendアプリケーション全体
- **間接影響**: 他のフロントエンドアプリケーション（liff-frontend）での類似パターン適用可能性
- **将来影響**: モノレポ全体での共通コンポーネント戦略

## Nuxt 3 ハイブリッドレンダリング戦略の設計決定 (2025-01-27)

### 背景と課題

Tech Post Cast LPフロントエンドにおいて、以下の要件を満たすアーキテクチャが必要だった：

- パブリックページ（LP、コンテンツページ）: SEO最適化のためSSG
- アプリケーションページ（/app/**）: インタラクティブ性のためSPA
- 単一のNuxt 3プロジェクトでの実現
- 開発・本番環境での一貫した動作

### 検討したアーキテクチャオプション

#### オプション1: 完全分離アーキテクチャ

- **構成**: LP用とアプリ用で別々のNuxtプロジェクト
- **利点**: 各々に最適化された設定、明確な責任分離
- **欠点**: コード重複、デプロイ複雑化、共通コンポーネント管理困難

#### オプション2: 完全SPAアーキテクチャ

- **構成**: 全ページをSPAとして実装
- **利点**: シンプルな設定、一貫したルーティング
- **欠点**: SEO問題、初期ロード時間増加

#### オプション3: ハイブリッドレンダリング（採用）

- **構成**: Nuxt 3のrouteRulesを活用したページ別レンダリング戦略
- **利点**: 各ページタイプに最適化、SEOとUX両立
- **欠点**: 設定複雑性、ハイドレーション問題

### 最終決定: ハイブリッドレンダリング戦略

#### 1. ルート別レンダリング設定

```typescript
routeRules: {
  // パブリックページ: SSG
  '/': { prerender: true },
  '/headline-topic-programs/**': { prerender: true },

  // 認証ページ: SPA
  '/login': { ssr: false },

  // アプリページ: SPA
  '/app/**': { ssr: false, headers: { 'cache-control': 'no-cache' } },

  // API: SSRなし
  '/api/**': { ssr: false, cache: false },
}
```

#### 2. SSGビルドでのSPAフォールバック

```typescript
// 200.html生成によるSPAフォールバック
compiled: async (nitro: Nitro) => {
  const indexPath = path.join(publicDir, 'index.html');
  const fallbackPath = path.join(publicDir, '200.html');
  fs.copyFileSync(indexPath, fallbackPath);
}
```

#### 3. クライアントサイドルーティング補強

- グローバルミドルウェアによる存在しないルートの処理
- クライアントサイドプラグインによるSPAルート初期化

### 決定理由

#### KEY INSIGHT: パフォーマンスとSEOの両立

1. **SEO重要ページのSSG化**
   - 検索エンジンクローラーに最適化
   - 高速な初期ロード
   - CDN配信に適した静的ファイル

2. **アプリページのSPA化**
   - リッチなインタラクション
   - 状態管理の簡素化
   - API通信の効率化

3. **開発・運用効率**
   - 単一プロジェクトでの管理
   - 共通コンポーネントの再利用
   - 統一されたビルドプロセス

### 技術的制約と対応策

#### 制約1: SSRハイドレーション問題

- **対応**: ClientOnlyコンポーネントによるラッピング
- **影響**: 初期レンダリング遅延（許容範囲内）

#### 制約2: 開発環境でのSPAルート不安定性

- **対応**: 開発専用のフォールバック処理
- **影響**: 開発体験の若干の低下

#### 制約3: エラーハンドリングの複雑性

- **対応**: シンプルなエラーページ設計
- **影響**: 高度なエラー処理の制限

### 将来の拡張性

#### スケーラビリティ考慮事項

1. **マイクロフロントエンド移行の可能性**
   - 現在の設計は将来的な分離に対応可能
   - 共通コンポーネントライブラリへの移行パス

2. **ISR（Incremental Static Regeneration）の導入**
   - 動的コンテンツのSSG化
   - キャッシュ戦略の最適化

3. **エッジコンピューティング対応**
   - Vercel Edge Functions等への対応
   - 地理的分散の最適化

### 関連決定事項

- Vuetifyコンポーネントライブラリの採用
- Clerkによる認証システム統合
- TypeScript strict mode適用

### 参考資料

- Nuxt 3 Hybrid Rendering Documentation
- Vuetify SSR Best Practices
- Static Site Hosting SPA Fallback Patterns

# アーキテクチャ設計決定記録

## フロントエンドバリデーション機能のアーキテクチャ設計 (2025-05-30)

### 背景と課題

パーソナルフィード管理画面において、ユーザー体験向上のためのリアルタイムバリデーション機能の実装が必要だった。既存のシンプルなバリデーションシステムから、拡張性と保守性を持つ包括的なバリデーションアーキテクチャへの移行。

### 検討したアーキテクチャ

1. **コンポーネント内バリデーション**: 各コンポーネント内でバリデーションロジックを実装
   - 利点: シンプル、依存関係が少ない
   - 欠点: 重複コード、一貫性の欠如、テストが困難
2. **中央集権型バリデーション**: 単一のバリデーションサービスですべてを管理
   - 利点: 一貫性、重複排除
   - 欠点: 単一障害点、拡張性の問題
3. **モジュラー型バリデーション**: 機能別に分離されたバリデーションモジュール
   - 利点: 拡張性、テスタビリティ、再利用性
   - 欠点: 初期実装の複雑性

### 決定事項と理由

**モジュラー型バリデーションアーキテクチャを採用**

#### アーキテクチャ構成

```
src/
├── utils/validation/
│   └── feed-validation.ts          # バリデーションロジック
├── composables/validation/
│   └── useFeedValidation.ts        # リアクティブ状態管理
├── composables/error-handling/
│   └── useEnhancedErrorHandler.ts  # エラーハンドリング
├── composables/api/
│   └── useRetryableApiCall.ts      # API呼び出し
└── composables/loading/
    └── useProgressiveLoading.ts    # ローディング管理
```

#### 設計原則

1. **関心の分離**: バリデーション、エラーハンドリング、ローディングを独立したモジュールに分離
2. **単一責任**: 各モジュールは特定の責任のみを持つ
3. **依存性注入**: 設定値（制限値等）は外部から注入可能
4. **段階的導入**: 既存システムとの互換性を保ちながら段階的に導入

### 学んだ教訓

#### KEY INSIGHT: レイヤー分離の重要性

```typescript
// レイヤー1: 純粋なバリデーション関数（ビジネスロジック）
export const validateTagsFilter = (tags: string[], maxTags: number): FieldValidationResult

// レイヤー2: リアクティブ状態管理（Vue固有）
export const useFeedValidation = (feedData: Ref<InputPersonalizedFeedData>)

// レイヤー3: UI統合（コンポーネント固有）
const { validationResult, isValid } = useFeedValidation(feedData)
```

#### KEY INSIGHT: 設定の外部化

```typescript
// ハードコードを避け、設定を外部化
interface ValidationOptions {
  maxTags?: number;
  maxAuthors?: number;
  debounceDelay?: number;
  realtime?: boolean;
}
```

#### KEY INSIGHT: 既存システムとの統合戦略

- 新しいバリデーション機能を既存のpropsと並行して動作
- 段階的な移行により、リスクを最小化
- 後方互換性を保持

#### GLOBAL LEARNING: Vue 3 Composition APIでのアーキテクチャパターン

- Composableは単一の関心事に集中
- リアクティブな状態管理とビジネスロジックを分離
- 依存性注入により、テスタビリティを向上

### アーキテクチャの利点

1. **拡張性**: 新しいバリデーションルールやフィールドを容易に追加
2. **再利用性**: 他のフォーム画面でも同じアーキテクチャを適用可能
3. **テスタビリティ**: 各レイヤーを独立してテスト可能
4. **保守性**: 関心の分離により、変更の影響範囲を限定
5. **段階的導入**: 既存システムを破壊することなく新機能を導入

### 今後の拡張計画

1. **他フォーム画面への適用**: 同じアーキテクチャパターンを他の画面に展開
2. **バリデーションルールの外部化**: 設定ファイルや管理画面からのルール変更
3. **国際化対応**: エラーメッセージの多言語対応
4. **パフォーマンス最適化**: バリデーション処理の最適化

### 関連タスク

- TPC-101: ユーザーダッシュボードの実装
- パーソナルフィード管理画面のバリデーション機能統合
