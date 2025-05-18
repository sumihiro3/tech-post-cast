# Stripe決済システム実装タスク詳細

## 概要

Premiumプランの課金機能実装のため、Stripeサービスを導入し、サブスクリプション管理システムを構築する詳細タスク。

## 課金モデル検討

### Premiumプラン料金体系の検討

- **優先度**: P0
- **状態**: 未着手
- **期限**: 未設定
- **説明**: サブスクリプションの料金体系とプラン設計
- **依存関係**: なし
- **検討項目**:
    - 料金プラン
        - 月額/年額料金設定
        - 複数プラン（Basic/Premium/Enterprise等）の必要性
        - プラン毎の機能差異
    - 支払いサイクル
        - 毎月請求 vs 年間一括請求
        - 請求日設定（登録日基準/固定日）
    - 割引オプション
        - 年間契約割引
        - プロモーションコード対応
    - 市場分析
        - 競合サービスの料金比較
        - 適切な価格帯の決定

### 無料トライアル/オンボーディング戦略

- **優先度**: P1
- **状態**: 未着手
- **期限**: 未設定
- **説明**: 新規ユーザー獲得のためのトライアル期間とオンボーディング設計
- **依存関係**: Premiumプラン料金体系の検討
- **検討項目**:
    - トライアル設計
        - 期間（7日/14日/30日等）
        - 機能制限の有無
        - クレジットカード要否
    - オンボーディングフロー
        - 登録から課金までの導線
        - トライアル中のユーザー体験
    - コンバージョン戦略
        - トライアル終了前のリマインド
        - コンバージョン率向上施策

## データベース設計

### 課金関連テーブル設計

- **優先度**: P0
- **状態**: 未着手
- **期限**: 未設定
- **説明**: サブスクリプション情報や支払い履歴を管理するテーブル設計
- **依存関係**: Premiumプラン料金体系の検討
- **詳細**:

    - サブスクリプションテーブル(subscriptions)
        - id: UUID (PK)
        - user_id: UUID (FK to users)
        - stripe_subscription_id: string
        - plan_id: string
        - status: enum (active, canceled, past_due, etc)
        - current_period_start: timestamp
        - current_period_end: timestamp
        - cancel_at: timestamp (null if not scheduled)
        - canceled_at: timestamp (null if not canceled)
        - created_at: timestamp
        - updated_at: timestamp

    - 支払い履歴テーブル(payment_history)
        - id: UUID (PK)
        - user_id: UUID (FK to users)
        - subscription_id: UUID (FK to subscriptions)
        - stripe_invoice_id: string
        - stripe_payment_intent_id: string
        - amount: decimal
        - currency: string
        - status: enum (succeeded, failed, pending)
        - payment_method_type: string
        - payment_date: timestamp
        - created_at: timestamp
        - updated_at: timestamp

    - プランテーブル(plans)
        - id: UUID (PK)
        - stripe_price_id: string
        - name: string
        - description: text
        - amount: decimal
        - currency: string
        - interval: enum (month, year)
        - is_active: boolean
        - created_at: timestamp
        - updated_at: timestamp

### ユーザーテーブル拡張

- **優先度**: P1
- **状態**: 未着手
- **期限**: 未設定
- **説明**: 既存ユーザーテーブルへのStripe連携情報追加
- **依存関係**: なし
- **詳細**:
    - 追加フィールド
        - stripe_customer_id: string
        - subscription_status: enum (none, active, past_due, canceled)
        - payment_method_last4: string
        - payment_method_type: string

## Stripe連携実装

### Stripe SDK導入

- **優先度**: P0
- **状態**: 未着手
- **期限**: 未設定
- **説明**: Stripe SDKの導入と基本設定
- **依存関係**: なし
- **サブタスク**:
  1. Stripe SDK依存関係の追加
  2. API鍵の環境設定
  3. テスト環境と本番環境の分離設定
  4. 基本的なStripe APIテスト

### 顧客管理実装

- **優先度**: P1
- **状態**: 未着手
- **期限**: 未設定
- **説明**: Stripeの顧客情報管理機能の実装
- **依存関係**: Stripe SDK導入, ユーザーテーブル拡張
- **サブタスク**:
  1. 顧客作成処理の実装
  2. 顧客情報更新処理の実装
  3. 顧客情報取得処理の実装
  4. 支払い方法管理の実装

### サブスクリプション管理実装

- **優先度**: P0
- **状態**: 未着手
- **期限**: 未設定
- **説明**: サブスクリプションのライフサイクル管理機能の実装
- **依存関係**: 顧客管理実装, 課金関連テーブル設計
- **サブタスク**:
  1. サブスクリプション作成処理
  2. サブスクリプション更新処理
  3. サブスクリプションキャンセル処理
  4. プラン変更処理
  5. サブスクリプション状態同期処理

### 決済ページフロー実装

- **優先度**: P1
- **状態**: 未着手
- **期限**: 未設定
- **説明**: ユーザーが課金情報を入力するためのページ実装
- **依存関係**: Stripe SDK導入
- **サブタスク**:
  1. Stripe Elementsの実装
  2. カード情報入力フォーム実装
  3. 支払い処理UI実装
  4. エラーハンドリングとバリデーション
  5. 3Dセキュア対応

### Webhook処理実装

- **優先度**: P0
- **状態**: 未着手
- **期限**: 未設定
- **説明**: Stripeからのイベント通知を処理するWebhook実装
- **依存関係**: サブスクリプション管理実装
- **サブタスク**:
  1. Webhook受信エンドポイント実装
  2. Webhook署名検証処理
  3. イベント種別ごとの処理実装
     - 支払い成功/失敗
     - サブスクリプション更新/期限切れ
     - 請求書作成/支払い
  4. エラーハンドリングとリトライ処理

## フロントエンド実装

### サブスクリプション管理UI

- **優先度**: P1
- **状態**: 未着手
- **期限**: 未設定
- **説明**: ユーザーがサブスクリプション状態を確認・管理するためのUI実装
- **依存関係**: サブスクリプション管理実装
- **サブタスク**:
  1. プラン表示・選択UI
  2. サブスクリプション状態表示
  3. 支払い方法管理UI
  4. プラン変更フロー
  5. キャンセルフロー

### 請求書・支払い履歴表示

- **優先度**: P2
- **状態**: 未着手
- **期限**: 未設定
- **説明**: ユーザーが請求書や支払い履歴を確認するためのUI実装
- **依存関係**: 支払い履歴テーブル実装
- **サブタスク**:
  1. 支払い履歴一覧表示
  2. 請求書詳細表示
  3. 請求書PDF/メール送信機能
  4. 領収書発行機能

## テスト・デプロイ

### Stripe連携テスト

- **優先度**: P0
- **状態**: 未着手
- **期限**: 未設定
- **説明**: Stripeとの連携機能の総合テスト
- **依存関係**: 全Stripe連携実装完了
- **サブタスク**:
  1. テストモードでの支払いフローテスト
  2. Webhook処理テスト
  3. エラーケーステスト
  4. 定期請求サイクルテスト

### 本番環境準備

- **優先度**: P1
- **状態**: 未着手
- **期限**: 未設定
- **説明**: Stripe本番環境の設定と移行準備
- **依存関係**: Stripe連携テスト
- **サブタスク**:
  1. 本番APIキーの安全な管理設定
  2. 本番Webhook設定
  3. 本番プラン・価格設定
  4. 本番環境でのエンドツーエンドテスト
