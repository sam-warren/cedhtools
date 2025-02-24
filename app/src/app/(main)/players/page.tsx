import PlayersPage from "@/pages/main/players/players";
import { getPlayers } from "@/services/players";

export default async function Page() {
  const players = await getPlayers();
  return <PlayersPage players={players} />;
}
