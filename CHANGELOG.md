# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **ユーザー設定API実装** (TPC-101)
    - ユーザー設定取得エンドポイント (`GET /user-settings`)
    - ユーザー設定更新エンドポイント (`PATCH /user-settings`)
    - Slack Webhook URLテストエンドポイント (`POST /user-settings/test-slack-webhook`)
    - AppUserモデルに`slackWebhookUrl`と`notificationEnabled`フィールドを追加
    - ユーザー設定管理のための完全なドメイン層実装
    - Slack通知機能のテスト機能
    - 包括的なテストカバレッジ（42テスト）
    - OpenAPI仕様への自動統合

### Changed

- データベーススキーマの拡張（AppUserテーブル）
- 既存テストファクトリクラスの新フィールド対応

### Technical Details

- **アーキテクチャ**: Repository パターン、DI、Clean Architecture
- **セキュリティ**: JWT認証、URLマスキング、入力値バリデーション
- **テスト**: 単体テスト、統合テスト、モック化
- **ドキュメント**: OpenAPI仕様、詳細なAPIドキュメント

### Files Added

- `apps/api-backend/src/controllers/user-settings/` - コントローラー層
- `apps/api-backend/src/domains/user-settings/` - ドメイン層
- `apps/api-backend/src/infrastructure/database/user-settings/` - インフラ層
- `apps/api-backend/src/types/errors/user-settings.error.ts` - エラー定義
- `apps/api-backend/docs/user-settings-api.md` - APIドキュメント
- `rest-client/api-backend/user-settings.http` - REST Client実行例
- 対応するテストファイル群

### Database Migration

- Migration: `20250527025712_add_user_settings` - ユーザー設定フィールド追加
