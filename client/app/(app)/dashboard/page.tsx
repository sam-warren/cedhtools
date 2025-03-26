import { createClient } from "@/app/utils/supabase/server";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
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
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  
  // Return null for unauthenticated users, which will be handled in the component
  if (!authUser) return null;

  const { data: userStats } = await supabase
    .from("users")
    .select("*, deck_analyses(count)")
    .eq("id", authUser.id)
    .single();

  const { data: recentAnalyses } = await supabase
    .from("deck_analyses")
    .select(
      `
      id,
      moxfield_url,
      created_at,
      deck_name,
      commanders:commander_id (
        name,
        wins,
        losses
      )
    `
    )
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentTournaments } = await supabase
    .from("processed_tournaments")
    .select("name, processed_at")
    .order("processed_at", { ascending: false })
    .limit(5);

  // Get first name from full name, or use email as fallback
  const firstName = authUser.user_metadata.full_name?.split(' ')[0];

  // Format the analysis data to match the Analysis type
  const formattedAnalyses = recentAnalyses?.map(analysis => {
    // Handle the case where commanders might be an array
    const commander = Array.isArray(analysis.commanders) 
      ? analysis.commanders[0] 
      : analysis.commanders;
      
    return {
      id: analysis.id,
      moxfield_url: analysis.moxfield_url,
      created_at: analysis.created_at,
      deck_name: analysis.deck_name,
      commanders: {
        name: commander?.name || "Unknown Commander",
        wins: commander?.wins || 0,
        losses: commander?.losses || 0
      }
    };
  }) || [];

  return {
    user: {
      ...userStats,
      full_name: firstName
    },
    recentAnalyses: formattedAnalyses,
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
            <p className="mb-4">You need to sign in to view your dashboard and save your deck analyses.</p>
            <Button asChild>
              <Link href="/login?returnTo=/dashboard">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, recentAnalyses, recentTournaments } = stats;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold font-mono tracking-tight">Welcome back, {user.full_name || user.email}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Use the sidebar to analyze a deck or explore recent tournaments.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <DashboardStats analyses={recentAnalyses || []} />
        <TournamentStats tournaments={recentTournaments || []} />
      </div>
    </div>
  );
}
