import { createClient } from "@/app/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      throw new Error("Missing Stripe webhook secret");
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        
        if (!userId || !customerId) {
          throw new Error("Missing userId or customerId");
        }

        // Update user's subscription information
        await supabase.from("stripe_customers").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        });

        // Store the subscription ID for future reference
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const priceId = subscription.items.data[0].price.id;
          // All subscriptions set to PRO tier
          const tier = "PRO";

          await supabase.from("subscriptions").insert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          });

          // Update the user's subscription tier and limits
          await supabase.from("users").update({
            subscription_tier: tier,
            subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            stripe_customer_id: customerId,
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            analyses_limit: 999999, // Practically unlimited
          }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        
        // Get the user from the subscription
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        
        if (!subscriptionData) {
          console.error(`No subscription found for subscription ID: ${subscriptionId}`);
          break;
        }
        
        const userId = subscriptionData.user_id;
        
        // Update the subscription record
        await supabase.from("subscriptions").update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);
        
        // Update the user record
        await supabase.from("users").update({
          subscription_status: subscription.status,
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", userId);
        
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        
        // Get the user from the subscription
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();
        
        if (!subscriptionData) {
          console.error(`No subscription found for subscription ID: ${subscriptionId}`);
          break;
        }
        
        const userId = subscriptionData.user_id;
        
        // Update the subscription record
        await supabase.from("subscriptions").update({
          status: subscription.status,
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);
        
        // Reset the user to FREE tier
        await supabase.from("users").update({
          subscription_tier: "FREE",
          subscription_status: "inactive",
          analyses_limit: 5, // Reset to free tier limit
          updated_at: new Date().toISOString(),
        }).eq("id", userId);
        
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error processing webhook" },
      { status: 500 }
    );
  }
} 