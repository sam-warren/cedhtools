import { createClient } from "@/app/utils/supabase/server";
import { createCheckoutSession, TIER_TO_PRICE_ID } from "@/lib/stripe";
import { ensureUserRecord } from "@/lib/user-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const priceId = searchParams.get("priceId");
        const userId = searchParams.get("userId");
        const returnUrl = searchParams.get("returnUrl");

        if (!priceId || !userId || !returnUrl) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Validate the price ID is one that we recognize
        if (!Object.values(TIER_TO_PRICE_ID).includes(priceId)) {
            return NextResponse.json(
                { error: "Invalid price ID" },
                { status: 400 }
            );
        }

        // Get auth user info
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Check if userId matches authenticated user
        if (userId !== authUser.id) {
            return NextResponse.json(
                { error: "User ID mismatch" },
                { status: 403 }
            );
        }

        // Ensure user record exists in the database
        const { error: userError } = await ensureUserRecord(
            supabase,
            authUser.id,
            authUser.email || ''
        );

        if (userError) {
            console.error('Error ensuring user record:', userError);
            return NextResponse.json(
                { error: "Failed to ensure user record" },
                { status: 500 }
            );
        }

        // Create a checkout session
        const session = await createCheckoutSession({
            priceId,
            userId,
            returnUrl,
        });

        if (!session || !session.url) {
            return NextResponse.json(
                { error: "Failed to create checkout session" },
                { status: 500 }
            );
        }

        // Redirect to the Stripe Checkout page
        return NextResponse.redirect(session.url);
    } catch (error) {
        console.error("Error in checkout route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 