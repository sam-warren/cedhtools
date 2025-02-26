import CommanderCardDetailsPage from "@/pages/main/commanders/commander-card-details";
import {
  getCardDistribution,
  getCardPopularityHistory,
  getCardStats,
  getCardWinRateHistory
} from "@/services/commanders";

export default async function Page({ params }: { params: { commanderId: string; cardId: string } }) {
  const [cardStats, distribution, winRateHistory, popularityHistory] = await Promise.all([
    getCardStats(params.commanderId, params.cardId),
    getCardDistribution(params.commanderId, params.cardId),
    getCardWinRateHistory(params.commanderId, params.cardId),
    getCardPopularityHistory(params.commanderId, params.cardId)
  ]);

  if (!cardStats || !distribution || !winRateHistory || !popularityHistory) {
    return <div>Card not found</div>;
  }

  return (
    <CommanderCardDetailsPage
      cardStats={cardStats}
      distribution={distribution}
      winRateHistory={winRateHistory}
      popularityHistory={popularityHistory}
      commanderName={commanderName}
    />
  );
}
