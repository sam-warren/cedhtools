import Stripe from 'stripe';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Define a mapping between Stripe price IDs and subscription tiers
export const TIER_TO_PRICE_ID: Record<string, string> = {
    PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',  // Monthly subscription
};

// Define subscription features
export const TIER_FEATURES: Record<string, { name: string, description: string, features: string[], price: number, interval: 'month' | 'year' }> = {
    FREE: {
        name: 'Free',
        description: 'Basic access to cedhtools',
        features: [
            '5 free deck analyses',
            'Basic statistics',
            'Standard data access',
        ],
        price: 0,
        interval: 'month',
    },
    PRO: {
        name: 'Pro',
        description: 'Enhanced features for competitive players',
        features: [
            'Unlimited deck analyses',
            'Advanced statistics and insights',
            'Get statistics for cards not in your deck',
        ],
        price: 9.99,
        interval: 'month',
    }
};

// Helper to get user's stripe ID from our database
export async function getUserStripeId(userId: string, supabase: SupabaseClient<Database>) {
    const { data, error } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

    if (error) {
        return null;
    }

    return data?.stripe_customer_id;
}

// Helper to create a checkout session
export async function createCheckoutSession({
    priceId,
    userId,
    returnUrl,
}: {
    priceId: string;
    userId: string;
    returnUrl: string;
}) {
    // Create a new checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${returnUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}/payment/cancelled`,
        client_reference_id: userId,
        // Automatically create a customer record if one doesn't exist
        customer_creation: 'always',
        metadata: {
            userId,
        },
    });

    return session;
}

// Helper to create a customer portal session
export async function createCustomerPortalSession({
    customerId,
    returnUrl,
}: {
    customerId: string;
    returnUrl: string;
}) {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session;
} 