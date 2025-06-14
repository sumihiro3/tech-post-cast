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

```txt
useUIState (新規)
├── 独自のSnackbar実装
├── 独自のProgress実装
└── 独自の状態管理
```

- **利点**: 完全に統一されたAPI、シンプルな依存関係
- **欠点**: 既存の動作するコードを破棄、開発コストが高い、リスクが大きい

#### オプション2: レイヤード統一アーキテクチャ（採用）

```txt
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

```txt
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

```txt
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

## 番組生成履歴API多層アーキテクチャ設計 (2024-12-19)

### 背景と課題

ダッシュボード機能の一環として番組生成履歴APIを実装する際、既存のアーキテクチャパターンとの整合性を保ちながら、セキュリティ、パフォーマンス、保守性を考慮した設計が必要だった。

### 検討したアプローチ

1. **アーキテクチャパターン**
   - 単層アーキテクチャ（Controller直接DB操作）
   - 多層アーキテクチャ（Controller → Service → Repository → DB）
   - 多層アーキテクチャを採用（責任分離と保守性）

2. **データアクセス層設計**
   - 汎用Repository vs 専用Repository
   - 既存Repositoryの拡張を採用（一貫性保持）

3. **セキュリティ層の配置**
   - Controller層 vs Service層
   - Service層での実装を採用（ビジネスロジック統合）

### 決定事項と理由

#### 1. 多層アーキテクチャの採用

```txt
Controller Layer (API)
    ↓ (DTO変換、認証)
Service Layer (Business Logic)
    ↓ (セキュリティ、ビジネスルール)
Repository Layer (Data Access)
    ↓ (データ取得、関連データ結合)
Database (Prisma)
```

**理由**:

- 責任の明確な分離
- テスタビリティの向上
- 既存プロジェクトパターンとの一貫性

#### 2. Repository層の拡張設計

```typescript
interface IPersonalizedProgramAttemptsRepository {
  // 既存メソッド
  findByUserId(userId: string, options: PaginationOptions): Promise<PersonalizedProgramAttemptsResult>;

  // 新規追加メソッド
  findByUserIdWithRelationsForDashboard(
    userId: string,
    options: PaginationOptions & { feedId?: string }
  ): Promise<PersonalizedProgramAttemptsWithRelationsResult>;
}
```

**理由**:

- 既存インターフェイスの自然な拡張
- 関連データ取得の効率化
- 用途別メソッドの明確な分離

#### 3. セキュリティ層の統合設計

```typescript
// Service層でのセキュリティチェック
async getProgramGenerationHistory(userId: string, request: GetDashboardProgramGenerationHistoryRequestDto) {
  // 1. ユーザー存在確認
  await this.validateUserExists(userId);

  // 2. feedId所有者確認
  if (request.feedId) {
    await this.validateFeedOwnership(userId, request.feedId);
  }

  // 3. データ取得とビジネスロジック
  // ...
}
```

**理由**:

- ビジネスロジックとセキュリティの統合
- 一箇所でのセキュリティ制御
- テストの容易性

### 実装詳細

#### 1. DTO設計パターン

```typescript
// ネスト構造による一貫性
export class ProgramGenerationHistoryDto {
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
```

#### 2. エラーハンドリング統一

```typescript
// 情報漏洩防止のためのエラーメッセージ統一
if (!feed || feed.userId !== userId) {
  throw new NotFoundException('指定されたフィードが見つかりません');
}
```

### 学んだ教訓

- **KEY INSIGHT**: 多層アーキテクチャは初期コストが高いが、長期的な保守性で大きなメリット
- **セキュリティ統合**: Service層でのセキュリティチェックにより、ビジネスロジックとの整合性確保
- **既存パターン活用**: 新機能実装時は既存アーキテクチャパターンの踏襲が重要
- **段階的拡張**: 既存インターフェイスの自然な拡張により、破壊的変更を回避

### パフォーマンス考慮事項

1. **N+1問題回避**: Prismaのincludeによる効率的な関連データ取得
2. **ページネーション**: 大量データ対応のためのlimit/offset実装
3. **インデックス活用**: userId, feedIdでの効率的な検索

### 将来の拡張性

1. **キャッシュ層追加**: Service層とRepository層の間にキャッシュ層挿入可能
2. **イベント駆動**: Service層からのイベント発行による非同期処理対応
3. **マイクロサービス分割**: Repository層の独立サービス化が容易

### 関連タスク

TPC-101 ユーザーダッシュボードの実装

---

## SSR/SSG混在環境でのページングコンポーネント設計 (2024-12-19)

### 背景と課題

パーソナルプログラム一覧のページング機能で404エラーが発生。調査の結果、既存の`Pagination.vue`コンポーネントがSSG用に設計されており、SSRページでは適切に動作しないことが判明。

**技術的詳細**

- ヘッドライントピック番組: SSG（`href`による画面遷移）
- パーソナルプログラム: SSR（`navigateTo()`による画面遷移）
- 同一プロジェクト内でのSSR/SSG混在アーキテクチャ

### 検討したアプローチ

1. **新しいSSR専用コンポーネントの作成**
   - 利点: 明確な責任分離、既存機能への影響なし
   - 欠点: コードの重複、保守コストの増加

2. **既存コンポーネントの完全置き換え**
   - 利点: 単一コンポーネントでの管理
   - 欠点: 既存のSSG機能への影響リスク

3. **既存コンポーネントの拡張（採用）**
   - 利点: 既存機能の維持、単一コンポーネントでの管理
   - 欠点: コンポーネントの複雑性がわずかに増加

### 決定事項と理由

**採用した設計**

```vue
<template lang="pug">
nav(v-if='props.pages > 1')
  ul.pagination
    // SSRモードの場合
    template(v-if='props.mode === "ssr"')
      li
        button(@click='navigateToPage(page)')

    // SSGモードの場合（既存の実装）
    template(v-else)
      li
        a(:href='linkUrl')
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number;
  pages: number;
  linkPrefix: string;
  mode?: 'ssr' | 'ssg'; // 新しいプロパティ
}>();

const navigateToPage = (page: number): void => {
  if (props.mode === 'ssr') {
    navigateTo(`${props.linkPrefix}/${page}`);
  }
};
</script>
```

**決定理由**

1. **後方互換性の維持**: 既存のSSG機能に影響を与えない
2. **保守性の向上**: 単一コンポーネントでの管理
3. **明確な責任分離**: `mode`プロパティによる動作の明示的制御
4. **拡張性**: 将来的な新しいモードの追加が容易

### 学んだ教訓

#### KEY INSIGHT: SSR/SSG混在環境でのコンポーネント設計原則

1. **モード切り替えパターンの有効性**
   - プロパティによる動作切り替えが効果的
   - テンプレート内での条件分岐により、異なるレンダリングモードに対応

2. **画面遷移方式の違いの重要性**
   - SSG: `href`による従来のHTML遷移
   - SSR: `navigateTo()`によるSPA的遷移
   - 適切な方式の選択がUXに大きく影響

3. **既存機能への影響最小化**
   - 新機能追加時は既存機能への影響を最小限に抑制
   - デフォルト値の設定により後方互換性を確保

#### 設計ガイドライン

- SSR/SSG混在プロジェクトでは、コンポーネント設計時にレンダリングモードを考慮
- `mode`プロパティパターンを他のコンポーネントでも活用可能
- 画面遷移を含むコンポーネントはとくに注意が必要

### 関連タスク

- TPC-117: パーソナルプログラム一覧でページングが機能しない
- パーソナルプログラム生成履歴のページング検証（対応不要と判定）

---

## IRssFileUploaderインターフェイス分離によるClean Architecture準拠 (2024-12-19)

### 背景と課題

- 初期実装では`IRssFileUploader`インターフェイスと`S3RssFileUploader`実装クラスが同一ファイルに配置されていた
- これはClean Architectureの原則に反し、ドメイン層とインフラストラクチャ層の境界が曖昧になっていた
- 既存の`S3ProgramFileUploader`（backend）では適切にインターフェイスがドメイン層に分離されており、一貫性の問題があった

### 検討したアプローチ

1. **現状維持**: インターフェイスと実装を同一ファイルに保持
   - 利点: ファイル数が少なく、シンプル
   - 欠点: Clean Architectureに反する、テスタビリティが低い、一貫性がない

2. **インターフェイス分離**: ドメイン層にインターフェイス、インフラ層に実装を配置
   - 利点: Clean Architecture準拠、テスタビリティ向上、既存パターンとの一貫性
   - 欠点: ファイル数が増加、初期の学習コストがわずかに増加

### 決定事項と理由

**インターフェイス分離アプローチを採用**

**決定理由:**

- Clean Architectureの依存関係逆転原則に準拠
- 既存の`S3ProgramFileUploader`パターンとの一貫性確保
- テスタビリティの向上（モック作成が容易）
- 将来的な実装変更（AWS S3からCloudflare R2への切り替えなど）への対応力向上

**実装詳細:**

- `apps/api-backend/src/domains/user-settings/rss-file-uploader.interface.ts`: インターフェイス定義
- `apps/api-backend/src/infrastructure/external-api/aws/s3/rss-file-uploader.ts`: 具体実装
- 関連する型定義（`RssFileUploadCommand`, `RssFileUploadResult`, `RssFileDeleteCommand`）もインターフェイスファイルに集約

### 学んだ教訓

1. **KEY INSIGHT**: 初期実装時からアーキテクチャパターンの一貫性を保つことの重要性
2. インターフェイス分離は後からでも比較的容易に実施可能だが、最初から適切に設計する方が効率的
3. 既存のコードベースにおけるパターンの調査と踏襲が、一貫性のあるアーキテクチャ構築に重要
4. TypeScriptの型システムを活用することで、インターフェイス分離時のリファクタリングが安全に実行可能

### 関連タスク

- TPC-92: パーソナルプログラムのRSSを出力できるようにする
- UserSettingsController拡張タスク

---
