"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { BarChart3 } from "lucide-react";
import type { Analysis } from "@/lib/types/dashboard";

const columns: ColumnDef<Analysis>[] = [
  {
    accessorKey: "commanders.name",
    header: "Commander",
  },
  {
    accessorKey: "moxfield_url",
    header: "Deck URL",
    cell: ({ row }) => {
      const url = row.getValue("moxfield_url") as string;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          View Deck
        </a>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Analyzed",
    cell: ({ row }) => {
      return formatDistanceToNow(
        new Date(row.getValue("created_at") as string),
        {
          addSuffix: true,
        }
      );
    },
  },
  {
    id: "winRate",
    header: "Win Rate",
    cell: ({ row }) => {
      const commander = row.original.commanders;
      const total = commander.wins + commander.losses;
      const winRate =
        total > 0 ? Math.round((commander.wins / total) * 100) : 0;
      return `${winRate}%`;
    },
  },
];

interface DashboardStatsProps {
  analyses: Analysis[];
}

export function DashboardStats({ analyses }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Your most recent deck analyses</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={analyses || []} />
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Commander Stats</CardTitle>
          <CardDescription>
            Win rates of your analyzed commanders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyses?.map((analysis) => (
              <div key={analysis.id} className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {analysis.commanders.name}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BarChart3 className="mr-1 h-4 w-4" />
                    Win rate:{" "}
                    {Math.round(
                      (analysis.commanders.wins /
                        (analysis.commanders.wins +
                          analysis.commanders.losses)) *
                        100
                    )}
                    %
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
