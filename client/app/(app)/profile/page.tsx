import { createClient } from "@/app/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function Profile() {
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
            <p className="mb-4">
              Sign in to track your deck analyses and manage your account
              settings.
            </p>
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

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          You can manage your account profile here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                User ID
              </p>
              <p className="font-medium text-sm truncate" title={user?.id}>
                {user?.id}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Last Sign In
              </p>
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
            <CardDescription>Your deck analysis history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="font-medium">Recent Analyses</h4>
              </div>
              {analysisData && analysisData.length > 0 ? (
                <div className="divide-y">
                  {analysisData.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="px-4 py-2 flex justify-between items-center"
                    >
                      <p
                        className="text-sm truncate max-w-[200px]"
                        title={analysis.moxfield_url}
                      >
                        {analysis.deck_name ||
                          `Deck ${analysis.moxfield_url.split("/").pop()}`}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No recent analyses found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
