# API Backend Rest Client

このディレクトリには、Tech Post Cast API Backend用のRest Clientファイルが含まれています。

## 📁 ファイル構成

- `dashboard.http` - ダッシュボード関連API
- `personalized-feeds.http` - パーソナルフィード関連API
- `personalized-program-attempts.http` - 番組生成試行履歴関連API
- `user-settings.http` - ユーザー設定関連API
- `qiita-posts-search.http` - Qiita記事検索関連API

## 🚀 セットアップ

### 1. 環境変数ファイルの作成

`.env`ファイルを作成し、以下の内容を設定してください：

```env
# API ベースURL
BASE_URL=http://localhost:8080/api

# JWT認証トークン
JWT_TOKEN=your_jwt_token_here

# 実際のリソースID（テスト用）
PROGRAM_ID=program-id-here
FEED_ID=feed-id-here
```

### 2. JWT認証トークンの取得方法

1. フロントエンドアプリケーション（`http://localhost:3000`）にログイン
2. ブラウザの開発者ツールでネットワークタブを開く
3. APIリクエストのAuthorizationヘッダーからトークンをコピー
4. `.env`ファイルの`JWT_TOKEN`に設定

### 3. 実際のリソースIDの取得

- **プログラムID**: ダッシュボードでプログラム一覧を取得し、実際のIDを使用
- **フィードID**: パーソナルフィード一覧を取得し、実際のIDを使用

## 📋 ダッシュボードAPI一覧

### 基本情報取得

- `GET /dashboard/stats` - ダッシュボード統計情報
- `GET /dashboard/subscription` - サブスクリプション情報

### プログラム関連

- `GET /dashboard/personalized-programs` - プログラム一覧
- `GET /dashboard/personalized-programs/{id}` - プログラム詳細

### 番組生成履歴（新機能）

- `GET /dashboard/program-generation-history` - 番組生成履歴一覧
- `GET /dashboard/program-generation-history?feedId={feedId}` - フィード別履歴

### その他

- `GET /dashboard/personalized-feeds/summary` - フィード概要情報

## 🔧 使用方法

### VS Code Rest Client拡張機能

1. VS Codeに「REST Client」拡張機能をインストール
2. `.http`ファイルを開く
3. リクエストの上にある「Send Request」をクリック

### IntelliJ IDEA / WebStorm

1. `.http`ファイルを開く
2. リクエストの横にある実行ボタンをクリック

## 📊 レスポンス例

### ダッシュボード統計情報

```json
{
  "activeFeedsCount": 5,
  "totalEpisodesCount": 12,
  "totalProgramDuration": "2.5h"
}
```

### 番組生成履歴

```json
{
  "history": [
    {
      "id": "attempt-1",
      "createdAt": "2024-01-25T10:00:00.000Z",
      "feed": {
        "id": "feed-1",
        "name": "React技術記事"
      },
      "status": "SUCCESS",
      "reason": null,
      "postCount": 5,
      "program": {
        "id": "program-1",
        "title": "今週のReact記事まとめ"
      }
    }
  ],
  "totalCount": 25,
  "limit": 20,
  "offset": 0,
  "hasNext": true
}
```

## 🚨 エラーケース

各APIファイルには、以下のエラーケースのテストも含まれています：

- **401 Unauthorized**: 認証なし・無効なトークン
- **400 Bad Request**: 無効なパラメーター
- **404 Not Found**: 存在しないリソース・権限なし

## 🔒 セキュリティ

- `.env`ファイルは`.gitignore`に含まれており、Gitにコミットされません
- JWT認証トークンは機密情報として扱ってください
- 他のユーザーのリソースにはアクセスできません（認可チェック）

## 📝 注意事項

- 環境変数ファイル（`.env`）は各自で作成してください
- 実際のリソースIDは環境に応じて変更してください
- APIサーバーが起動していることを確認してください（`http://localhost:8080`）
