# Tech Post Cast プロジェクト構造

**最終更新日**: 2023-07-05

このドキュメントは、Tech Post Castプロジェクトの構造と重要なディレクトリについて記録しています。

## モノレポ構造

Tech Post Castはモノレポ構造を採用しており、複数のアプリケーションとパッケージが含まれています。

### 主要ディレクトリ

- `apps/`: 各アプリケーションのソースコード
    - `api-backend/`: バックエンドAPI (NestJS)
    - `backend/`: 番組生成用バックエンドAPI (NestJS)
    - `lp-frontend/`: ランディングページフロントエンド (Nuxt3)
    - `liff-frontend/`: LIFFフロントエンド (Nuxt3)
    - `line-bot/`: LINEボット (Hono)
    - `infra/`: インフラストラクチャコード (AWS CDK)

- `packages/`: 共有パッケージ
    - `database/`: データベース関連コード・スキーマ
    - `commons/`: 共通ユーティリティと機能

- `docs/`: プロジェクトドキュメント
    - `coding-rules/`: 詳細なコーディングルール

## 設定ファイル

- `.cursor/rules/`: Cursorプロジェクトルール
    - `common.mdc`: モノレポ共通実装ルール
    - `api-backend.mdc`: NestJSバックエンド実装ルール
    - `lp-frontend.mdc`: Nuxt 3フロントエンド実装ルール
    - `task-management.mdc`: タスク管理・記憶領域ルール

- `.github/`: GitHub関連の設定
    - `workflows/`: GitHub Actions ワークフロー
    - `copilot.yml`: GitHub Copilot設定

## パッケージ管理

- パッケージ管理にはYarnを使用
- ルートの `package.json` にはモノレポ全体の依存関係を記述
- 各アプリケーションの `package.json` にはそのアプリケーション固有の依存関係を記述

## データベース

- データベーススキーマは `packages/database/prisma/schema.prisma` に定義
- マイグレーションは `packages/database/prisma/migrations` に保存

## 環境設定

- 環境変数は各アプリケーションディレクトリの `.env` ファイルで管理
- 機密情報は `.env` に含めず、AWS Secrets Managerで管理

## ドキュメント構造

- コーディングルールは `/docs/coding-rules/` ディレクトリに保存
- APIドキュメントはOpenAPI仕様に基づいて自動生成
- 設計ドキュメントは `/docs/design/` ディレクトリに保存
