"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ColorIdentity } from "./color-identity";
import type { CommanderListItem } from "@/types/api";

interface CommanderCardProps {
  commander: CommanderListItem;
  rank?: number;
}

export function CommanderCard({ commander, rank }: CommanderCardProps) {
  const conversionPercent = (commander.conversion_rate * 100).toFixed(1);
  const winRatePercent = (commander.win_rate * 100).toFixed(1);
  const metaPercent = (commander.meta_share * 100).toFixed(1);

  return (
    <Link href={`/commanders/${encodeURIComponent(commander.name)}`}>
      <Card className="card-hover cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {rank && (
                <span className="text-xs font-mono text-muted-foreground">
                  #{rank}
                </span>
              )}
              <h3 className="font-semibold text-base leading-tight truncate">
                {commander.name}
              </h3>
            </div>
            <ColorIdentity colorId={commander.color_id} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Conversion</p>
              <p className="font-semibold text-lg stat-positive">
                {conversionPercent}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Win Rate</p>
              <p className="font-semibold text-lg">{winRatePercent}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Entries</p>
              <p className="font-medium">{commander.entries}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Meta Share</p>
              <p className="font-medium">{metaPercent}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CommanderCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-8 bg-muted rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-1">
            <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
            <div className="h-5 w-5 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
