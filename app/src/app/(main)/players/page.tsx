import PlayersPage from "@/pages/main/players/players";
import { getPlayers } from "@/services/players";

export default async function Page() {
  const playersList = await getPlayersList();
  const playersStats = await getPlayersStats();
  return <PlayersPage playersList={playersList} playersStats={playersStats} />;
}
