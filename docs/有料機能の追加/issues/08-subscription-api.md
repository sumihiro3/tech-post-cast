# サブスクリプション管理APIの実装

## 概要

ユーザーのサブスクリプション状態を管理するAPIの実装

## 詳細

- サブスクリプションモジュール作成（NestJS）
- ユーザーのサブスクリプション状態取得API
- Stripe Webhookイベント処理の実装
- サブスクリプションステータス更新ロジック
- プラン変更・キャンセル処理の実装
- アクセス権限検証ミドルウェアの実装

## 受け入れ基準

- ユーザーのサブスクリプション状態が正確に取得できること
- Stripe決済完了時にサブスクリプション情報が正しく更新されること
- プランに応じた機能制限が正しく適用されること
- サブスクリプションの有効期限が正しく管理されること
