import { Metadata } from "next";
import { createClient } from "@/app/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Command, Users } from "lucide-react";
import type { Analysis } from "@/lib/types/dashboard";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
      *,
      commanders (
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

  return {
    user: {
      ...userStats,
      full_name: firstName
    },
    recentAnalyses: recentAnalyses as Analysis[],
    recentTournaments,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();
  if (!stats) return null;

  const { user, recentAnalyses, recentTournaments } = stats;
  const now = new Date();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold font-mono tracking-tight">Welcome back, {user.full_name || user.email}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Command className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.analyses_used}</div>
            <p className="text-xs text-muted-foreground">
              Limit: {user.analyses_limit}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.subscription_tier}</div>
            <p className="text-xs text-muted-foreground">Active subscription</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (user.analyses_used /
                  ((new Date().getTime() -
                    new Date(user.created_at).getTime()) /
                    (1000 * 60 * 60 * 24))) *
                  100
              ) / 100}
            </div>
            <p className="text-xs text-muted-foreground">Analyses per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.subscription_end_date
                ? Math.max(
                    0,
                    Math.floor(
                      (new Date(user.subscription_end_date).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                : "∞"}
            </div>
            <p className="text-xs text-muted-foreground">Days until renewal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recently Imported Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTournaments?.map((tournament) => {
                const processedAt = new Date(tournament.processed_at);
                const isNew = now.getTime() - processedAt.getTime() < 24 * 60 * 60 * 1000;
                
                return (
                  <div key={tournament.processed_at} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tournament.name}</span>
                      {isNew && (
                        <Badge variant="default" className="bg-indigo-500">NEW</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(processedAt, "dd-MM-yyyy")}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <DashboardStats analyses={recentAnalyses || []} />
        </div>
      </div>
    </div>
  );
}
