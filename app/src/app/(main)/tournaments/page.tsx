import TournamentsPage from "@/pages/main/tournaments/tournaments";
import { getTournaments } from "@/services/tournaments";

export default async function Page() {
  const tournaments = await getTournaments();
  return <TournamentsPage tournaments={tournaments} />;
}
