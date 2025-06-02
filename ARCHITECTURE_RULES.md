# Tech Post Cast - アーキテクチャルール

## 🚨 必須ルール（齟齬防止）

### NestJS Repository実装

```typescript
// 1. インターフェイス定義（ドメイン層）
// src/domains/users/users.repository.interface.ts
export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
}

// 2. 実装クラス（インフラ層）
// src/infrastructure/database/users/users.repository.ts
@Injectable()
export class UsersRepository implements IUsersRepository {
  // 実装
}

// 3. DI設定（モジュール）
providers: [
  {
    provide: 'UsersRepository',
    useClass: UsersRepository,
  },
]

// 4. サービスで注入
constructor(
  @Inject('UsersRepository')
  private readonly repository: IUsersRepository,
) {}
```

### テストデータ管理

```typescript
// 1. ファクトリクラス作成
// src/test/factories/user.factory.ts
export class UserFactory {
  static createUser(overrides = {}): User {
    return { id: '1', name: 'test', ...overrides };
  }
}

// 2. テストで使用
const user = UserFactory.createUser({ name: 'custom' });
```

## 📁 ディレクトリ構造

```
src/
├── domains/                    # ドメイン層
│   └── {domain}/
│       ├── {domain}.repository.interface.ts
│       └── {domain}.service.ts
├── infrastructure/             # インフラ層
│   └── database/
│       └── {domain}/
│           └── {domain}.repository.ts
├── controllers/               # プレゼンテーション層
├── test/
│   └── factories/            # テストファクトリ
└── types/
    └── errors/              # カスタムエラー
```

## 🔗 詳細ガイドライン

- [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)
- [docs/coding-rules/](./docs/coding-rules/)
- [.cursor/rules/](./.cursor/rules/)
