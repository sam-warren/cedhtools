import TournamentsPage from "@/pages/main/tournaments/tournaments";
import { getTournaments } from "@/services/tournaments";

export default async function Page() {
  const tournamentsList = await getTournamentList();
  const tournamentsStats = await getTournamentsStats();
  return <TournamentsPage tournamentsList={tournamentsList} tournamentsStats={tournamentsStats} />;
}
