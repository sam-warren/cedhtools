'use server';

import type { Tournament, TournamentDetails } from "@/types/api/tournaments";
import { mockTournamentData } from "@/lib/mock/tournaments";
import { createMockListFetcher, createMockItemWithDetailsFetcher, withErrorHandling, withCache } from "./apiUtils";

// Create a function to enhance a tournament with additional details
const enhanceTournamentWithDetails = (tournament: Tournament): TournamentDetails => ({
  ...tournament,
  standings: [
    {
      rank: 1,
      player: "John Smith",
      commander: "Kinnan, Bonder Prodigy",
      wins: 6,
      losses: 1,
      draws: 0,
      points: 18
    },
    {
      rank: 2,
      player: "Jane Doe",
      commander: "Najeela, the Blade-Blossom",
      wins: 5,
      losses: 2,
      draws: 0,
      points: 15
    }
  ],
  commanderStats: [
    {
      name: "Kinnan, Bonder Prodigy",
      count: 8,
      winRate: 58.3
    },
    {
      name: "Najeela, the Blade-Blossom",
      count: 6,
      winRate: 52.1
    }
  ],
  roundStats: [
    {
      round: 1,
      avgGameLength: 45,
      drawRate: 10.5
    },
    {
      round: 2,
      avgGameLength: 42,
      drawRate: 8.2
    }
  ]
});

// Create the service functions using the utility functions
export const getTournaments = withErrorHandling(
  withCache(
    createMockListFetcher<Tournament>(mockTournamentData)
  )
);

export const getTournamentById = withErrorHandling(
  withCache(
    createMockItemWithDetailsFetcher<Tournament, TournamentDetails>(
      mockTournamentData,
      enhanceTournamentWithDetails
    )
  )
); 