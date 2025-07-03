# フィード別番組生成履歴API

## 概要

フィード別の番組生成試行履歴の取得・統計情報の提供を行うAPIです。ユーザーダッシュボードでフィードごとの番組生成状況を確認するために使用されます。

## 認証

すべてのエンドポイントでClerk JWTトークンによる認証が必要です。

```
Authorization: Bearer <JWT_TOKEN>
```

## エンドポイント

### 1. フィード別番組生成履歴一覧取得

指定されたフィードの番組生成試行履歴一覧をページネーション付きで取得します。

**エンドポイント**

```
GET /personalized-program-attempts/feeds/{feedId}
```

**パラメーター**

- `feedId` (path, required): フィードID
- `page` (query, optional): ページ番号（1から始まる、デフォルト: 1）
- `limit` (query, optional): 1ページあたりの件数（1-100、デフォルト: 20）

**レスポンス例**

```json
{
  "attempts": [
    {
      "id": "attempt_1234567890",
      "userId": "user_1234567890",
      "feedId": "feed_1234567890",
      "programId": "program_1234567890",
      "status": "SUCCESS",
      "reason": null,
      "postCount": 5,
      "createdAt": "2024-01-03T10:00:00.000Z"
    },
    {
      "id": "attempt_0987654321",
      "userId": "user_1234567890",
      "feedId": "feed_1234567890",
      "programId": null,
      "status": "SKIPPED",
      "reason": "NOT_ENOUGH_POSTS",
      "postCount": 2,
      "createdAt": "2024-01-02T10:00:00.000Z"
    }
  ],
  "totalCount": 25,
  "currentPage": 1,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**ステータスコード**

- `200`: 成功
- `404`: フィードが見つからない、またはアクセス権限がない
- `401`: 認証が必要
- `500`: サーバー内部エラー

### 2. フィード別番組生成履歴統計情報取得

指定されたフィードの番組生成試行履歴の統計情報を取得します。

**エンドポイント**

```
GET /personalized-program-attempts/feeds/{feedId}/statistics
```

**パラメーター**

- `feedId` (path, required): フィードID

**レスポンス例**

```json
{
  "totalAttempts": 10,
  "successCount": 7,
  "skippedCount": 2,
  "failedCount": 1,
  "successRate": 70.0,
  "lastAttemptDate": "2024-01-03T10:00:00.000Z",
  "lastSuccessDate": "2024-01-03T10:00:00.000Z"
}
```

**ステータスコード**

- `200`: 成功
- `404`: フィードが見つからない、またはアクセス権限がない
- `401`: 認証が必要
- `500`: サーバー内部エラー

### 3. フィード別番組生成履歴件数取得

指定されたフィードの番組生成試行履歴の総件数を取得します。

**エンドポイント**

```
GET /personalized-program-attempts/feeds/{feedId}/count
```

**パラメーター**

- `feedId` (path, required): フィードID

**レスポンス例**

```json
{
  "count": 42
}
```

**ステータスコード**

- `200`: 成功
- `404`: フィードが見つからない、またはアクセス権限がない
- `401`: 認証が必要
- `500`: サーバー内部エラー

## データ構造

### PersonalizedProgramAttemptDto

番組生成試行履歴の基本データ構造です。

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| id | string | ✓ | 試行履歴ID |
| userId | string | ✓ | ユーザーID |
| feedId | string | ✓ | フィードID |
| programId | string | - | 生成された番組ID（成功時のみ） |
| status | string | ✓ | 試行ステータス（SUCCESS/SKIPPED/FAILED） |
| reason | string | - | 失敗理由（失敗・スキップ時のみ） |
| postCount | number | ✓ | 記事数 |
| createdAt | string | ✓ | 試行日時（ISO 8601形式） |

### 試行ステータス

| ステータス | 説明 |
|-----------|------|
| SUCCESS | 番組生成成功 |
| SKIPPED | 記事不足等の理由で生成をスキップ |
| FAILED | 処理エラー等で生成に失敗 |

### 失敗理由

| 理由 | 説明 |
|------|------|
| NOT_ENOUGH_POSTS | 紹介記事数が不足している |
| UPLOAD_ERROR | アップロードエラー |
| PERSISTENCE_ERROR | 永続化エラー |
| OTHER | その他 |

## 使用例

### JavaScript/TypeScript

```typescript
// フィード別番組生成履歴一覧取得
const response = await fetch('/personalized-program-attempts/feeds/feed_123?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// 統計情報取得
const statsResponse = await fetch('/personalized-program-attempts/feeds/feed_123/statistics', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});
const stats = await statsResponse.json();
```

### cURL

```bash
# 履歴一覧取得
curl -X GET "http://localhost:3000/personalized-program-attempts/feeds/feed_123?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 統計情報取得
curl -X GET "http://localhost:3000/personalized-program-attempts/feeds/feed_123/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 件数取得
curl -X GET "http://localhost:3000/personalized-program-attempts/feeds/feed_123/count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## エラーハンドリング

### 一般的なエラーレスポンス

```json
{
  "statusCode": 404,
  "message": "フィードが見つからない、またはアクセス権限がありません",
  "error": "Not Found"
}
```

### エラー対応

1. **404 Not Found**: フィードIDを確認し、ユーザーがそのフィードにアクセス権限を持っているか確認してください
2. **401 Unauthorized**: JWTトークンが有効か確認してください
3. **500 Internal Server Error**: サーバー側の問題です。しばらく時間をおいて再試行してください

## 制限事項

- 1ページあたりの最大取得件数は100件です
- 過去の履歴データは無期限で保持されます
- 統計情報は全期間のデータを対象とします
