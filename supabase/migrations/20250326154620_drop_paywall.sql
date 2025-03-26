-- Drop payment-related tables
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS stripe_customers;

-- Remove payment-related columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_id,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_start_date,
DROP COLUMN IF EXISTS subscription_end_date,
DROP COLUMN IF EXISTS analyses_limit;

-- Drop payment-related indexes
DROP INDEX IF EXISTS idx_stripe_customers_user_id;
DROP INDEX IF EXISTS idx_stripe_customers_stripe_customer_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_users_subscription_id;

-- Remove the trigger and function for incrementing analyses_used
DROP TRIGGER IF EXISTS increment_analyses_used ON deck_analyses;
DROP FUNCTION IF EXISTS increment_analyses_used();