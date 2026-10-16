-- Remove Stripe legacy columns and index
DROP INDEX IF EXISTS idx_account_stripe_customer;
ALTER TABLE account DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE account DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE pricing_plan DROP COLUMN IF EXISTS stripe_price_id;
