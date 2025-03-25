import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { createClient } from "@/app/utils/supabase/server";
import { TIER_FEATURES } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  async function createCheckoutSession(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login?next=/pricing");
    }

    const priceId = formData.get("priceId")?.toString();

    if (!priceId) {
      throw new Error("Price ID is required");
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Redirect to API route that handles Stripe checkout
    return redirect(
      `/api/stripe/checkout?priceId=${priceId}&userId=${user.id}&returnUrl=${origin}`
    );
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Choose Your Plan</h1>
        <p className="mt-4 text-muted-foreground">
          Upgrade to get unlimited deck analyses and advanced statistics for
          your competitive EDH gameplay.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 mx-auto max-w-3xl">
        {/* Free Tier */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">{TIER_FEATURES.FREE.name}</CardTitle>
            <div>
              <span className="text-3xl font-bold">Free</span>
            </div>
            <CardDescription>{TIER_FEATURES.FREE.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <div className="space-y-2">
              {TIER_FEATURES.FREE.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled={true}>
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Monthly Tier */}
        <Card className="flex flex-col border-primary">
          <CardHeader>
            <div className="bg-primary px-3 py-1 text-xs text-primary-foreground w-fit rounded-full mb-2">
              PRO
            </div>
            <CardTitle className="text-xl">{TIER_FEATURES.PRO.name}</CardTitle>
            <div>
              <span className="text-3xl font-bold">
                ${TIER_FEATURES.PRO.price}
              </span>
              <span className="text-muted-foreground ml-1">
                /{TIER_FEATURES.PRO.interval}
              </span>
            </div>
            <CardDescription>{TIER_FEATURES.PRO.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <div className="space-y-2">
              {TIER_FEATURES.PRO.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <form action={createCheckoutSession} className="w-full">
              <input
                type="hidden"
                name="priceId"
                value={process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID}
              />
              <Button className="w-full" type="submit">
                Upgrade Now
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
