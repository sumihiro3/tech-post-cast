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
