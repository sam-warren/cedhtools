import { createClient } from "@/app/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsIcon, TrashIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Access the params after resolving the promise
  const params = await searchParams;
  const tab = params?.tab;
  const activeTab = tab || "account";
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user is authenticated, display a login prompt
  if (!user) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Sign in to manage your account settings
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to view and manage your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Sign in to track your deck analyses and manage your account settings.</p>
            <Button asChild>
              <Link href="/login?returnTo=/profile">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user analysis history
  const { data: analysisData } = await supabase
    .from("deck_analyses")
    .select("id, created_at, moxfield_url, deck_name")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

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
          You can manage your account settings here.
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList className="mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCircleIcon size={16} />
            <span>Account</span>
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your deck analysis history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-card">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-medium">Recent Analyses</h4>
                  </div>
                  {analysisData && analysisData.length > 0 ? (
                    <div className="divide-y">
                      {analysisData.map((analysis) => (
                        <div key={analysis.id} className="px-4 py-2 flex justify-between items-center">
                          <p className="text-sm truncate max-w-[200px]" title={analysis.moxfield_url}>
                            {analysis.deck_name || `Deck ${analysis.moxfield_url.split('/').pop()}`}
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
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete your account and all associated data.
                    </p>
                  </div>
                  <form action={deleteAccount}>
                    <Button type="submit" variant="destructive" size="sm" className="flex items-center gap-1">
                      <TrashIcon size={14} />
                      <span>Delete</span>
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
