import { createClient } from "@/app/utils/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangleIcon, CreditCardIcon, SettingsIcon, TrashIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ portal_error?: string; tab?: string }>;
}) {
  // Access the params after resolving the promise
  const params = await searchParams;
  const portalError = params?.portal_error;
  const tab = params?.tab;
  const activeTab = tab || "account";
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user details including subscription info
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Get subscription details if user has one
  let subscriptionData;
  if (userData?.subscription_id) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", userData.subscription_id)
      .single();
    subscriptionData = data;
  }

  // Get user analysis history
  const { data: analysisData } = await supabase
    .from("deck_analyses")
    .select("id, created_at, moxfield_url")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Helper function to format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check for portal configuration error
  const hasPortalError = portalError === "configuration";

  // Check subscription status:
  const isImmediatelyCanceled = userData?.subscription_status === "canceled";
  const isEndOfPeriodCanceled =
    userData?.subscription_status === "active" &&
    subscriptionData?.cancel_at_period_end === true;

  const isCanceled = isImmediatelyCanceled || isEndOfPeriodCanceled;
  const isPro = userData?.subscription_tier === "PRO";

  // Determine status label to show
  let statusLabel = "";
  if (isImmediatelyCanceled) {
    statusLabel = "Canceled";
  } else if (isEndOfPeriodCanceled) {
    statusLabel = "Cancels at period end";
  } else if (userData?.subscription_status === "active") {
    statusLabel = "Active";
  } else {
    statusLabel = userData?.subscription_status || "";
  }

  // Calculate usage percentage
  const usageLimit = userData?.analyses_limit || 5;
  const usageCount = userData?.analyses_used || 0;
  const usagePercentage = isPro ? 100 : Math.min(Math.round((usageCount / usageLimit) * 100), 100);
  
  // Format the usage limit display
  const formattedLimit = isPro ? "Unlimited" : usageLimit;

  // Server action to delete user account
  async function deleteAccount() {
    'use server';
    
    const supabase = await createClient();
    
    // Delete the user account
    const { error } = await supabase.auth.admin.deleteUser(user?.id as string);
    
    if (error) {
      console.error("Error deleting user:", error);
      return redirect('/profile?error=delete_failed');
    }
    
    return redirect('/login?message=account_deleted');
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          You can manage your account, billing, and team settings here.
        </p>
      </div>
      
      {hasPortalError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>Portal Configuration Required</AlertTitle>
          <AlertDescription>
            The Stripe Customer Portal needs to be configured in the Stripe
            Dashboard before it can be used. Please contact support.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList className="mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCircleIcon size={16} />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCardIcon size={16} />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <SettingsIcon size={16} />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Your personal account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="font-medium text-sm truncate" title={user?.id}>{user?.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Last Sign In</p>
                  <p className="font-medium">
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
                <CardDescription>
                  Your current usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Deck Analyses</p>
                    <p className="text-sm font-medium">{usageCount} / {formattedLimit}</p>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
                
                <div className="rounded-lg border bg-card mt-4">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-medium">Recent Analyses</h4>
                  </div>
                  {analysisData && analysisData.length > 0 ? (
                    <div className="divide-y">
                      {analysisData.map((analysis) => (
                        <div key={analysis.id} className="px-4 py-2 flex justify-between items-center">
                          <p className="text-sm truncate max-w-[200px]" title={analysis.moxfield_url}>
                            {analysis.moxfield_url.split('/').pop()}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No recent analyses found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="billing">
          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Subscription</span>
                  {userData?.subscription_tier && (
                    <Badge className={
                      isImmediatelyCanceled ? "bg-gray-500" :
                      isEndOfPeriodCanceled ? "bg-yellow-500" :
                      isPro ? "bg-green-500" : ""
                    }>
                      {statusLabel}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{userData?.subscription_tier || "FREE"}</h3>
                    {isPro && (
                      <Badge variant="outline" className="text-green-500 border-green-500">Current Plan</Badge>
                    )}
                  </div>
                  
                  {userData?.subscription_tier !== "FREE" && (
                    <div className="space-y-2 mt-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span>{formatDate(userData?.subscription_start_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isCanceled ? "Ends:" : "Renews:"}</span>
                        <span>{formatDate(userData?.subscription_end_date)}</span>
                      </div>
                      {isCanceled && (
                        <p className="text-sm text-yellow-500 mt-2">
                          {isEndOfPeriodCanceled
                            ? "Your subscription will be canceled at the end of the current billing period."
                            : "Your subscription has been canceled but remains active until the end date."}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {userData?.subscription_tier !== "FREE" ? (
                  <Button 
                    className="w-full" 
                    asChild 
                    disabled={hasPortalError}
                  >
                    <Link href="/api/stripe/portal?returnUrl=/profile?tab=billing">
                      {isCanceled ? "Reactivate Subscription" : "Manage Subscription"}
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/pricing">Upgrade to Pro</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced">
          <div className="grid gap-6 md:grid-cols-1">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-destructive p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <form action={deleteAccount}>
                      <Button variant="destructive" size="sm" type="submit">
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
