-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "default_payment_method_id" VARCHAR(100),
ADD COLUMN     "display_name" VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN     "stripe_customer_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "billing_interval" VARCHAR(20) NOT NULL DEFAULT 'month',
ADD COLUMN     "stripe_price_id" VARCHAR(100),
ADD COLUMN     "stripe_price_type" VARCHAR(20) NOT NULL DEFAULT 'recurring';

-- AlterTable
ALTER TABLE "subscription_histories" ADD COLUMN     "cancel_at" TIMESTAMP(3),
ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "current_period_start" TIMESTAMP(3),
ADD COLUMN     "stripe_event_id" VARCHAR(100),
ADD COLUMN     "stripe_event_type" VARCHAR(100),
ADD COLUMN     "stripe_price_id" VARCHAR(100),
ADD COLUMN     "stripe_subscription_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "cancel_at" TIMESTAMP(3),
ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "current_period_start" TIMESTAMP(3),
ADD COLUMN     "stripe_price_id" VARCHAR(100),
ADD COLUMN     "stripe_subscription_id" VARCHAR(100),
ADD COLUMN     "trial_end" TIMESTAMP(3),
ADD COLUMN     "trial_start" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "stripe_method_id" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last4" VARCHAR(4),
    "brand" VARCHAR(20),
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "subscription_id" VARCHAR(50),
    "stripe_invoice_id" VARCHAR(100) NOT NULL,
    "stripe_payment_intent_id" VARCHAR(100),
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'jpy',
    "status" VARCHAR(20) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "invoice_pdf" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" VARCHAR(50) NOT NULL,
    "stripe_event_id" VARCHAR(100) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "data" JSON NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_retry_at" TIMESTAMP(3),

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_events_stripe_event_id_key" ON "stripe_webhook_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_type_idx" ON "stripe_webhook_events"("type");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_processed_idx" ON "stripe_webhook_events"("processed");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
