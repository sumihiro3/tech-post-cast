# ユーザー設定API

## 概要

ユーザー設定APIは、認証されたユーザーの個人設定（表示名、Slack通知設定など）を管理するためのエンドポイントを提供します。

## 機能

- ユーザー設定の取得
- ユーザー設定の更新
- Slack Webhook URLのテスト

## エンドポイント

### 1. ユーザー設定取得

認証ユーザーの現在の設定を取得します。

```txt
GET /user-settings
```

**認証**: Bearer Token必須

**レスポンス例**:

```json
{
  "userId": "user_01234567890abcdef",
  "displayName": "田中 太郎",
  "slackWebhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXX",
  "notificationEnabled": true,
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. ユーザー設定更新

認証ユーザーの設定を更新します。

```txt
PATCH /user-settings
```

**認証**: Bearer Token必須

**リクエストボディ**:

```json
{
  "displayName": "田中 太郎",
  "slackWebhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXX",
  "notificationEnabled": true
}
```

**フィールド説明**:

- `displayName` (optional): パーソナルプログラム内で使用される表示名（最大100文字）
- `slackWebhookUrl` (optional): Slack Webhook URL（最大500文字）
- `notificationEnabled` (optional): 通知有効フラグ

**レスポンス**: ユーザー設定取得と同じ形式

### 3. Slack Webhook URLテスト

指定されたSlack Webhook URLに対してテスト通知を送信します。

```txt
POST /user-settings/test-slack-webhook
```

**認証**: Bearer Token必須

**リクエストボディ**:

```json
{
  "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXX"
}
```

**レスポンス例**:

```json
{
  "success": true,
  "errorMessage": null,
  "responseTime": 245
}
```

**失敗時のレスポンス例**:

```json
{
  "success": false,
  "errorMessage": "Slack API エラー: 404 Not Found",
  "responseTime": 1200
}
```

## エラーレスポンス

### 400 Bad Request

リクエストパラメーターが不正な場合

### 401 Unauthorized

認証トークンが無効または未提供の場合

### 404 Not Found

ユーザーが見つからない場合

### 500 Internal Server Error

サーバー内部エラーが発生した場合

## 実装詳細

### アーキテクチャ

- **Controller**: `UserSettingsController` - HTTPリクエストの処理
- **Service**: `UserSettingsService` - ビジネスロジック
- **Repository**: `UserSettingsRepository` - データアクセス
- **Entity**: `UserSettings` - ドメインエンティティ

### セキュリティ

- JWT認証による保護
- Slack Webhook URLのマスキング（ログ出力時）
- 入力値のバリデーション

### バリデーション

- `displayName`: 最大100文字
- `slackWebhookUrl`: 最大500文字、有効なSlack Webhook URL形式
- `notificationEnabled`: boolean値

### ログ出力

- すべての操作でデバッグログを出力
- Webhook URLは部分的にマスキングして出力
- エラー時は詳細なエラー情報を記録

## 使用例

### JavaScript/TypeScript

```typescript
// ユーザー設定取得
const response = await fetch('/user-settings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const userSettings = await response.json();

// ユーザー設定更新
const updateResponse = await fetch('/user-settings', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    displayName: '新しい表示名',
    notificationEnabled: true
  })
});

// Slack Webhook URLテスト
const testResponse = await fetch('/user-settings/test-slack-webhook', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    webhookUrl: 'https://hooks.slack.com/services/...'
  })
});
```

## テスト

### 単体テスト

- `UserSettingsService`: 26テスト
- `UserSettingsRepository`: 8テスト
- `UserSettingsController`: 8テスト

### テスト実行

```bash
# 全テスト実行
yarn test

# ユーザー設定関連のテストのみ実行
yarn test user-settings
```

## 関連ファイル

### コントローラー

- `src/controllers/user-settings/user-settings.controller.ts`
- `src/controllers/user-settings/user-settings.module.ts`

### DTO

- `src/controllers/user-settings/dto/get-user-settings.response.dto.ts`
- `src/controllers/user-settings/dto/update-user-settings.request.dto.ts`
- `src/controllers/user-settings/dto/test-slack-webhook.request.dto.ts`
- `src/controllers/user-settings/dto/test-slack-webhook.response.dto.ts`

### ドメイン層

- `src/domains/user-settings/user-settings.service.ts`
- `src/domains/user-settings/entities/user-settings.entity.ts`
- `src/domains/user-settings/user-settings.repository.interface.ts`

### インフラ層

- `src/infrastructure/database/user-settings/user-settings.repository.ts`

### エラー

- `src/types/errors/user-settings.error.ts`

### テスト

- `src/controllers/user-settings/user-settings.controller.spec.ts`
- `src/domains/user-settings/user-settings.service.spec.ts`
- `src/infrastructure/database/user-settings/user-settings.repository.spec.ts`
- `src/test/factories/user-settings.factory.ts`
