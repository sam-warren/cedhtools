import TournamentDetailsPage from "@/pages/main/tournaments/tournament-details";
import { getTournamentById } from "@/services/tournaments";

export default async function Page({ params }: { params: { tournamentId: string } }) {
  const tournamentDetails = await getTournamentById(params.tournamentId);
  const tournamentStats = await getTournamentStats(params.tournamentId);
  
  if (!tournamentDetails) {
    return <div>Tournament not found</div>;
  }

  return <TournamentDetailsPage tournamentDetails={tournamentDetails} />;
}
