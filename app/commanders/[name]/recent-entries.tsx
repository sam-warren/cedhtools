import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EntryInfo } from "@/types/api";
import { ExternalLink } from "lucide-react";

interface RecentEntriesProps {
  entries: EntryInfo[];
}

/**
 * Server Component for displaying recent tournament entries
 * This is purely display content that can be rendered on the server
 */
export function RecentEntries({ entries }: RecentEntriesProps) {
  if (!entries || entries.length === 0) {
    return null;
  }

  return (
    <section className="border-t pt-12">
      <h2 className="text-lg font-medium mb-6">Recent Tournament Entries</h2>
      <div className="overflow-x-auto -mx-4 px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Tournament</TableHead>
              <TableHead className="text-center">Standing</TableHead>
              <TableHead className="text-center">Record</TableHead>
              <TableHead className="text-right">Decklist</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.slice(0, 10).map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.player?.name || "Unknown"}</TableCell>
                <TableCell>
                  <div>
                    <p>{entry.tournament?.name || "Unknown Tournament"}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.tournament?.tournament_date
                        ? new Date(entry.tournament.tournament_date).toLocaleDateString()
                        : ""}
                      {entry.tournament?.size && ` • ${entry.tournament.size} players`}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={entry.standing && entry.standing <= 4 ? "default" : "secondary"}>
                    #{entry.standing || "?"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">
                  <span className="text-green-500">{entry.wins_swiss + entry.wins_bracket}</span>
                  {" - "}
                  <span className="text-red-500">{entry.losses_swiss + entry.losses_bracket}</span>
                  {entry.draws > 0 && (
                    <span className="text-muted-foreground"> - {entry.draws}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {entry.tournament?.tid && entry.player?.topdeck_id && (
                    <a
                      href={`https://topdeck.gg/deck/${entry.tournament.tid}/${entry.player.topdeck_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

