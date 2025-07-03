# Stripe AI への質問と回答

## 質問

他のAIでは下記の項目を保持したほうが良いと提案されました。これについて意見をください。

すべて Prisma のスキーマ定義です

```prisma
// アプリケーションの一般ユーザー
model AppUser {
  // ユーザーの一意なID（ClerkのユーザーID）
  id           String    @id @db.VarChar(50)
  // ユーザーの表示名
  displayName  String?

  // Stripe関連フィールド
  stripeCustomerId       String?
  defaultPaymentMethodId String?

  // リレーション
  subscriptions              Subscription[]
  subscriptionHistories      SubscriptionHistory[]
  paymentMethods PaymentMethod[]
  invoices       Invoice[]
}

// 料金プラン
model Plan {
  id          String
  name        String
  price       Int // 月額金額（円）
  description String
  isActive    Boolean

  // Stripe関連フィールド
  stripePriceId   String?
  stripePriceType String
  billingInterval String

  subscriptions         Subscription[]
  subscriptionHistories SubscriptionHistory[]
}

// ユーザーサブスクリプション
model Subscription {
  id        String
  userId    String
  planId    String
  startDate DateTime
  endDate   DateTime?
  isActive  Boolean
  status    String // ACTIVE, PAST_DUE, CANCELED, TRIALING, INCOMPLETE

  // Stripe関連フィールド
  stripeSubscriptionId String?
  stripePriceId        String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAt             DateTime?
  canceledAt           DateTime?
  trialStart           DateTime?
  trialEnd             DateTime?

  user      AppUser
  plan      Plan
  histories SubscriptionHistory[]
  invoices  Invoice[]

  @@map("subscriptions")
}

// サブスクリプション履歴
model SubscriptionHistory {
  id             String
  subscriptionId String
  userId         String
  planId         String
  status         String
  startDate      DateTime
  endDate        DateTime?

  // Stripe関連フィールド
  stripeSubscriptionId String?
  stripePriceId        String?
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAt             DateTime?
  canceledAt           DateTime?
  stripeEventId        String?
  stripeEventType      String?

  subscription Subscription
  user         AppUser
  plan         Plan
}


// 支払い方法
model PaymentMethod {
  id             String   @id @default(cuid()) @db.VarChar(50)
  userId         String   @map("user_id") @db.VarChar(50)
  stripeMethodId String   @map("stripe_method_id") @db.VarChar(100)
  type           String   @db.VarChar(50) // card, bank, etc.
  isDefault      Boolean  @default(false) @map("is_default")
  last4          String?  @db.VarChar(4) // クレジットカード番号の下4桁
  brand          String?  @db.VarChar(20) // visa, mastercard, etc.
  expiryMonth    Int?     @map("expiry_month")
  expiryYear     Int?     @map("expiry_year")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user AppUser @relation(fields: [userId], references: [id])

  @@map("payment_methods")
}

// 請求書
model Invoice {
  id                    String    @id @default(cuid()) @db.VarChar(50)
  userId                String    @map("user_id") @db.VarChar(50)
  subscriptionId        String?   @map("subscription_id") @db.VarChar(50)
  stripeInvoiceId       String    @map("stripe_invoice_id") @db.VarChar(100)
  stripePaymentIntentId String?   @map("stripe_payment_intent_id") @db.VarChar(100)
  amount                Int
  currency              String    @default("jpy") @db.VarChar(3)
  status                String    @db.VarChar(20) // paid, open, void, uncollectible
  paidAt                DateTime? @map("paid_at")
  invoicePdf            String?   @map("invoice_pdf") @db.VarChar(255)
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  user         AppUser       @relation(fields: [userId], references: [id])
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])

  @@map("invoices")
}
```

## Stripe AI の回答

ご提案いただいたPrismaスキーマ定義は、Stripeを使用したサブスクリプション管理のために非常に包括的で適切なものだと思います。以下に、各モデルについての意見と追加の提案を述べます

AppUser モデル: このモデルは適切に設計されています。Stripeの顧客IDとデフォルトの支払い方法IDを含んでいるのは良いプラクティスです。

Plan モデル: 料金プランの管理に必要な情報が含まれています。Stripeの価格IDと価格タイプ、請求間隔を含めているのは適切です。

Subscription モデル: サブスクリプションの詳細な情報を保持しており、Stripeのサブスクリプション情報とよく同期しています。statusフィールドはとくに有用で、サブスクリプションのライフサイクル管理に役立ちます。

SubscriptionHistory モデル: サブスクリプションの履歴を追跡するのは素晴らしいアイデアです。これにより、ユーザーのサブスクリプション変更履歴を把握し、分析や顧客サポートに活用できます。

PaymentMethod と Invoice モデル: これらのモデルは定義されていませんが、AppUserモデルとの関連が示されています。これらのモデルを追加することで、支払い方法と請求書の管理がより完全になります。

追加の提案：

PaymentMethod モデルの追加:

```prisma
model PaymentMethod {
  id                 String   @id
  userId             String
  stripePaymentMethodId String
  type               String
  last4              String?
  expirationMonth    Int?
  expirationYear     Int?
  isDefault          Boolean  @default(false)
  user               AppUser  @relation(fields: [userId], references: [id])
}
```

Invoice モデルの追加:

```prisma
model Invoice {
  id                 String   @id
  userId             String
  subscriptionId     String?
  stripeInvoiceId    String
  amount             Int
  status             String
  paidAt             DateTime?
  user               AppUser     @relation(fields: [userId], references: [id])
  subscription       Subscription? @relation(fields: [subscriptionId], references: [id])
}
```

Planモデルに機能や特典の情報を追加することを検討してください。これにより、各プランで利用可能な機能を簡単に管理できます。

StripeのWebhookイベントを記録するためのモデルを追加することも検討してください。これにより、Stripeからのイベントの処理と再試行を管理しやすくなります。

全体として、このスキーマはStripeを使用したサブスクリプション管理のために非常によく設計されています。必要な情報を適切に保持し、関連するエンティティ間の関係も適切にモデル化されています。これにより、アプリケーションでのサブスクリプション管理と、Stripeとの同期が容易になるでしょう。

## 追加の質問

- Planモデルには、プランごとでの最大許容数など、プランでの制約を表す項目を定義しています
    - maxFeeds など
- SubscriptionモデルとSubscriptionHistoryモデルに下記の似た項目がありますが、Stripe として使い分ける必要があるでしょうか
    - cancelAt             DateTime?
    - canceledAt           DateTime?
- StripeのWebhookイベントを記録するためのモデルを提案してください

## 追加の質問への回答

ご質問ありがとうございます。ご指摘の点について回答いたします。

Planモデルの制約項目について: プランごとの制約を表す項目を定義するのは非常に良いアプローチです。これにより、各プランの制限を簡単に管理できます。たとえば：

```prisma

model Plan {
  // ... 他のフィールド
  maxFeeds    Int?
  maxUsers    Int?
  maxStorage  Int? // GBなど
  // その他の制約項目
}
```

SubscriptionモデルとSubscriptionHistoryモデルのcancelAtとcanceledAtについて: これらのフィールドは実際にStripeで異なる目的で使用されるため、両方保持することをオススメします。

- cancelAt: 将来の特定の日時にサブスクリプションをキャンセルするようにスケジュールされた日時。
- canceledAt: サブスクリプションが実際にキャンセルされた日時。

両方のフィールドを保持することで、予定されたキャンセルと実際のキャンセルの両方を追跡できます。

StripeのWebhookイベントを記録するためのモデル提案:

```prisma
model StripeWebhookEvent {
  id               String   @id
  stripeEventId    String   @unique
  type             String
  data             Json
  created          DateTime
  processed        Boolean  @default(false)
  processedAt      DateTime?
  error            String?
  retryCount       Int      @default(0)
  lastRetryAt      DateTime?

  @@index([type])
  @@index([processed])
}
```

このモデルの特徴:

- id: イベントの一意の識別子（アプリケーション側で生成）
- stripeEventId: Stripeイベントの一意のID
- type: イベントのタイプ（例：customer.subscription.updated）
- data: イベントのペイロードデータ（JSONとして保存）
- created: イベントが作成された日時
- processed: イベントが処理されたかどうか
- processedAt: イベントが処理された日時
- error: 処理中にエラーが発生した場合のエラーメッセージ
- retryCount: 処理の再試行回数
- lastRetryAt: 最後に再試行された日時

このモデルを使用することで、Stripeからのすべてのイベントを記録し、適切に処理されたかどうかを追跡できます。また、処理に失敗したイベントの再試行も管理しやすくなります。

これらの提案により、Stripeとの連携をより効果的に管理し、サブスクリプションシステムの信頼性と追跡可能性を向上させることができます。

## 追加の質問2

- cancelAt: 将来の特定の日時にサブスクリプションをキャンセルするようにスケジュールされた日時。
- canceledAt: サブスクリプションが実際にキャンセルされた日時。

両方のフィールドを保持することで、予定されたキャンセルと実際のキャンセルの両方を追跡できます。

上記の回答についてさらに聞かせてください。
`cancelAt` に日付を設定する Stripe Webhook イベントを教えてください。
また、`canceledAt` に日付を設定する Stripe Webhook イベントを教えてください。

## 追加の質問2への回答

もちろん、cancelAt と canceledAt に関連するStripe Webhookイベントについて詳しく説明いたします。

### cancelAt に日付を設定するStripe Webhookイベント

cancelAt は直接的なWebhookイベントではありませんが、以下のイベントで関連情報を取得できます：

`customer.subscription.updated`

このイベントは、サブスクリプションが更新されたときに発生します。サブスクリプションの将来のキャンセルがスケジュールされた場合、このイベントのペイロードに cancel_at フィールドが含まれます。

たとえば：

```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "cancel_at": 1672531200, // Unix timestamp for the scheduled cancellation
      // その他のサブスクリプション詳細...
    }
  }
}
```

### canceledAt に日付を設定するStripe Webhookイベント

canceledAt に関連する主なWebhookイベントは以下の通りです：

customer.subscription.deleted
このイベントは、サブスクリプションが即時にキャンセルされたときに発生します。イベントのペイロードには canceled_at フィールドが含まれます。

例：

```json
{
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_1234567890",
      "canceled_at": 1672531200, // Unix timestamp for when the subscription was actually canceled
      // その他のサブスクリプション詳細...
    }
  }
}
```

注意点:

将来のキャンセルがスケジュールされている場合（cancel_at が設定されている場合）、実際のキャンセル時に customer.subscription.deleted イベントが発生し、その時点で canceled_at が設定されます。

customer.subscription.updated イベントは cancel_at が設定または変更されたときにも発生しますが、canceled_at は実際のキャンセル時まで設定されません。

サブスクリプションの即時キャンセルの場合、customer.subscription.updated イベントが先に発生し、その直後に customer.subscription.deleted イベントが発生します。両方のイベントで canceled_at が設定されます。

これらのイベントを適切に処理することで、サブスクリプションのキャンセルスケジュールと実際のキャンセル日時を正確に追跡できます。cancelAt と canceledAt の両方のフィールドを保持することで、予定されたキャンセルと実際のキャンセルの両方を区別して管理できます。

詳細については、[Stripe Events](https://docs.stripe.com/api/events/types) のドキュメントを参照してください。
