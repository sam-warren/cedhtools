import CommanderCardsPage from "@/pages/main/commanders/commander-cards";
import { getCommanderById } from "@/services/commanders";

export default async function Page({ params }: { params: { commanderId: string } }) {
  const commanderDetails = await getCommanderById(params.commanderId);
  
  if (!commanderDetails) {
    return <div>Commander not found</div>;
  }

  return <CommanderCardsPage commanderDetails={commanderDetails} />;
}
