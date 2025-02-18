"use client";

import { Trophy, Medal, Target, Users, Percent, Handshake, CalendarDays, ScrollText, Award, Crown, Ribbon } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface StatTrend {
  current: number;
  trend: number;
}

interface CommanderStats {
  tournamentWins: StatTrend;
  top4s: StatTrend;
  top10s: StatTrend;
  top16s: StatTrend;
  totalGames: number;
  wins: StatTrend;
  draws: StatTrend;
  winRate: StatTrend;
  drawRate: StatTrend;
  entries: {
    total: number;
    uniquePlayers: number;
    lastMonth: {
      entries: number;
      trend: number;
    };
  };
}

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
          trend={{
            value: stats.entries.lastMonth.trend,
            tooltipText: `${Math.abs(stats.entries.lastMonth.trend)}% ${stats.entries.lastMonth.trend > 0 ? "increase" : "decrease"} in entries compared to last month`
          }}
          infoTooltip="Total number of times this commander has been registered in tournaments"
        />

        <StatCard
          title="Average Win Rate"
          value={stats.winRate.current}
          icon={Award}
          subtext={`Won ${stats.wins.current} out of ${stats.totalGames} games`}
          trend={{
            value: stats.winRate.trend,
            tooltipText: `${Math.abs(stats.winRate.trend)}% ${stats.winRate.trend > 0 ? "increase" : "decrease"} in win rate compared to last month`
          }}
          valueFormat={(val) => `${Number(val).toFixed(1)}%`}
          infoTooltip="Percentage of games won across all tournament matches"
        />

        <StatCard
          title="Average Draw Rate"
          value={stats.drawRate.current}
          icon={Handshake}
          subtext={`Drew ${stats.draws.current} out of ${stats.totalGames} games`}
          trend={{
            value: stats.drawRate.trend,
            tooltipText: `${Math.abs(stats.drawRate.trend)}% ${stats.drawRate.trend > 0 ? "increase" : "decrease"} in draw rate compared to last month`
          }}
          valueFormat={(val) => `${Number(val).toFixed(1)}%`}
          infoTooltip="Percentage of games that ended in a draw"
        />
      </div>

      {/* Bottom row - 4 columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tournament Wins"
          value={stats.tournamentWins.current}
          icon={Crown}
          subtext={`${((stats.tournamentWins.current / stats.totalGames) * 100).toFixed(1)}% win rate in tournaments`}
          trend={{
            value: stats.tournamentWins.trend,
            tooltipText: `${Math.abs(stats.tournamentWins.trend)}% ${stats.tournamentWins.trend > 0 ? "increase" : "decrease"} in tournament wins compared to last month`
          }}
          infoTooltip="Number of tournaments won with this commander"
        />

        <StatCard
          title="Top 4s"
          value={stats.top4s.current}
          icon={Trophy}
          subtext={`${((stats.top4s.current / stats.totalGames) * 100).toFixed(1)}% top 4 rate`}
          trend={{
            value: stats.top4s.trend,
            tooltipText: `${Math.abs(stats.top4s.trend)}% ${stats.top4s.trend > 0 ? "increase" : "decrease"} in top 4 finishes compared to last month`
          }}
          infoTooltip="Number of times this commander has finished in the top 4"
        />

        <StatCard
          title="Top 10s"
          value={stats.top10s.current}
          icon={Medal}
          subtext={`${((stats.top10s.current / stats.totalGames) * 100).toFixed(1)}% top 10 rate`}
          trend={{
            value: stats.top10s.trend,
            tooltipText: `${Math.abs(stats.top10s.trend)}% ${stats.top10s.trend > 0 ? "increase" : "decrease"} in top 10 finishes compared to last month`
          }}
          infoTooltip="Number of times this commander has finished in the top 10"
        />

        <StatCard
          title="Top 16s"
          value={stats.top16s.current}
          icon={Ribbon}
          subtext={`${((stats.top16s.current / stats.totalGames) * 100).toFixed(1)}% top 16 rate`}
          trend={{
            value: stats.top16s.trend,
            tooltipText: `${Math.abs(stats.top16s.trend)}% ${stats.top16s.trend > 0 ? "increase" : "decrease"} in top 16 finishes compared to last month`
          }}
          infoTooltip="Number of times this commander has finished in the top 16"
        />
      </div>
    </div>
  );
}
