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
