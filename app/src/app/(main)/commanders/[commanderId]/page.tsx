import CommanderDetailsPage from "@/pages/main/commanders/commander-details";
import {
  getCommanderById,
  getCommanderMatchups,
  getCommanderPopularityHistory,
  getCommanderStats,
  getCommanderTopDecklists,
  getCommanderTopPlayers,
  getCommanderWinRateByCut,
  getCommanderWinRateBySeat,
  getCommanderWinRateHistory
} from "@/services/commanders";

export default async function Page({ params }: { params: { commanderId: string } }) {
  const [
    commander,
    stats,
    matchups,
    topPlayers,
    winRateHistory,
    popularityHistory,
    winRateBySeat,
    winRateByCut,
    topDecklists
  ] = await Promise.all([
    getCommanderById(params.commanderId),
    getCommanderStats(params.commanderId),
    getCommanderMatchups(params.commanderId),
    getCommanderTopPlayers(params.commanderId),
    getCommanderWinRateHistory(params.commanderId),
    getCommanderPopularityHistory(params.commanderId),
    getCommanderWinRateBySeat(params.commanderId),
    getCommanderWinRateByCut(params.commanderId),
    getCommanderTopDecklists(params.commanderId)
  ]);

  if (!commander) {
    return <div>Commander not found</div>;
  }

  return (
    <CommanderDetailsPage
      commander={commander}
      stats={stats}
      matchups={matchups}
      topPlayers={topPlayers}
      winRateHistory={winRateHistory}
      popularityHistory={popularityHistory}
      winRateBySeat={winRateBySeat}
      winRateByCut={winRateByCut}
      topDecklists={topDecklists}
    />
  );
}
