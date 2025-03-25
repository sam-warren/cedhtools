# Stripe Integration for cedhtools

This document outlines how to set up and use the Stripe integration for subscription management in cedhtools.

## Required Environment Variables

You need to set up the following environment variables in your `.env.local` and `.env.development` files:

```
# Stripe
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
```

## How to Get Stripe Variables

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)

2. **Get API Keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Copy the "Secret key" (starts with `sk_test_` for test mode or `sk_live_` for production)
   - Add it to your environment variables as `STRIPE_SECRET_KEY`

3. **Create Products and Prices**:
   - Go to [Stripe Products](https://dashboard.stripe.com/products)
   - Create a new product called "Pro Subscription"
   - Add a recurring monthly price (e.g., $9.99/month)
   - Copy the Price ID (starts with `price_`)
   - Add it to your environment variables as `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

4. **Set Up Webhook**:
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
   - Click "Add endpoint"
   - Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - After creating, copy the "Signing secret" (starts with `whsec_`)
   - Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Testing Locally with Stripe CLI

To test webhooks locally:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. The CLI will provide a webhook secret. Use this for your local development environment.

## Database Changes

This integration adds the following tables:

- `stripe_customers`: Links users to their Stripe customer ID
- `subscriptions`: Stores detailed subscription information

And adds columns to the `users` table:
- `stripe_customer_id`
- `subscription_status`
- `subscription_id`

## How Subscriptions Work

1. User clicks "Upgrade to PRO" button in the header
2. They're taken to the pricing page to choose between Free and Pro plans
3. Clicking the Upgrade Now button creates a Stripe Checkout session
4. User completes payment on Stripe's hosted checkout page
5. Stripe sends a webhook to our server to confirm the payment
6. The webhook handler updates the user's subscription status in our database
7. User is redirected to a success page

## Testing Payments

Use these test card numbers with any future expiration date and any three-digit CVC:

- Successful payment: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined payment: `4000 0000 0000 9995`

For more test cards, see [Stripe's test cards documentation](https://stripe.com/docs/testing#cards).

## Managing Subscriptions

Users can manage their subscriptions through the Stripe Customer Portal. You can add a "Manage Subscription" button to the profile page by creating an API route that creates a portal session and redirects the user. 