import { createServerClient } from "@/lib/api/supabase";
import { cookies } from "next/headers";
import { TournamentStats } from "@/components/dashboard/tournament-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | CEDHTools",
  description: "Your Commander deck analysis dashboard",
};

export const dynamic = "force-dynamic";

async function getStats() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  
  // Return null for unauthenticated users, which will be handled in the component
  if (!authUser) return null;

  const { data: userStats } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const { data: recentTournaments } = await supabase
    .from("processed_tournaments")
    .select("name, processed_at")
    .order("processed_at", { ascending: false })
    .limit(5);

  // Get first name from full name, or use email as fallback
  const firstName = authUser.user_metadata.full_name?.split(' ')[0];

  return {
    user: {
      ...userStats,
      full_name: firstName
    },
    recentTournaments,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  
  // Handle unauthenticated users with a login prompt
  if (!stats) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to sign in to view your dashboard.</p>
            <Button asChild>
              <Link href="/login?returnTo=/dashboard">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, recentTournaments } = stats;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold font-mono tracking-tight">Welcome back, {user.full_name || user.email}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use the search bar to find a commander and view their tournament statistics,
              or analyze your own deck against tournament data.
            </div>
            <Button asChild>
              <Link href="/">Search Commanders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <TournamentStats tournaments={recentTournaments || []} />
      </div>
    </div>
  );
}
