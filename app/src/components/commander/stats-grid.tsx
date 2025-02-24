"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Award, Crown, Handshake, Medal, Ribbon, ScrollText, Trophy } from "lucide-react";
import type { CommanderStats } from "@/types/api/commanders";

interface StatsGridProps {
  stats: CommanderStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="space-y-4">
      {/* Top row - 3 columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Tournament Entries"
          value={stats.entries.total}
          icon={ScrollText}
          subtext={`${stats.entries.uniquePlayers} unique players`}
          infoTooltip="Total number of times this commander has been registered in tournaments"
        />

        <StatCard
          title="Average Win Rate"
          value={stats.winRate}
          icon={Award}
          subtext={`Won ${stats.wins} out of ${stats.totalGames} games`}
          valueFormat={(val) => `${Number(val).toFixed(1)}%`}
          infoTooltip="Percentage of games won across all tournament matches"
        />

        <StatCard
          title="Average Draw Rate"
          value={stats.drawRate}
          icon={Handshake}
          subtext={`Drew ${stats.draws} out of ${stats.totalGames} games`}
          valueFormat={(val) => `${Number(val).toFixed(1)}%`}
          infoTooltip="Percentage of games that ended in a draw"
        />
      </div>

      {/* Bottom row - 4 columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tournament Wins"
          value={stats.tournamentWins}
          icon={Trophy}
          subtext={`From ${stats.entries.total} entries`}
          infoTooltip="Number of tournaments won with this commander"
        />

        <StatCard
          title="Top 4s"
          value={stats.top4s}
          icon={Medal}
          subtext={`${((stats.top4s / stats.totalGames) * 100).toFixed(1)}% top 4 conversion`}
          infoTooltip="Number of times this commander has finished in the top 4"
        />

        <StatCard
          title="Top 10s"
          value={stats.top10s}
          icon={Award}
          subtext={`${((stats.top10s / stats.totalGames) * 100).toFixed(1)}% top 10 conversion`}
          infoTooltip="Number of times this commander has finished in the top 10"
        />

        <StatCard
          title="Top 16s"
          value={stats.top16s}
          icon={Crown}
          subtext={`${((stats.top16s / stats.totalGames) * 100).toFixed(1)}% top 16 conversion`}
          infoTooltip="Number of times this commander has finished in the top 16"
        />
      </div>
    </div>
  );
}
