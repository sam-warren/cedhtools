import { createClient } from "@/app/utils/supabase/server";
import { createCustomerPortalSession, getUserStripeId } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/profile";
    
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Get the user's Stripe customer ID
    const stripeCustomerId = await getUserStripeId(user.id, supabase);
    
    if (!stripeCustomerId) {
      // If user doesn't have a Stripe customer ID, redirect to pricing
      return NextResponse.redirect(new URL("/pricing", request.url));
    }
    
    try {
      // Create a Stripe Customer Portal session
      const session = await createCustomerPortalSession({
        customerId: stripeCustomerId,
        returnUrl: `${new URL(returnUrl, request.url).origin}${returnUrl}`,
      });
      
      if (!session || !session.url) {
        return NextResponse.json(
          { error: "Failed to create portal session" },
          { status: 500 }
        );
      }
      
      // Redirect to Stripe Customer Portal
      return NextResponse.redirect(session.url);
    } catch (portalError) {
      console.error("Portal configuration error:", portalError);
      
      // Check if it's a Stripe error with a message about portal settings
      if (portalError instanceof Error && 
          portalError.message && 
          portalError.message.includes("portal settings")) {
        // Redirect back to profile with an error parameter
        const errorUrl = new URL(`${returnUrl}`, request.url);
        errorUrl.searchParams.set("portal_error", "configuration");
        return NextResponse.redirect(errorUrl);
      }
      
      throw portalError; // Re-throw if it's a different error
    }
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 