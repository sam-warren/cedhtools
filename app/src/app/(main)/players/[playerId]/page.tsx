import PlayerDetailsPage from "@/pages/main/players/player-details";
import { getPlayerById } from "@/services/players";

export default async function Page({ params }: { params: { playerId: string } }) {
  const playerDetails = await getPlayerById(params.playerId);
  
  if (!playerDetails) {
    return <div>Player not found</div>;
  }

  return <PlayerDetailsPage playerDetails={playerDetails} />;
}
