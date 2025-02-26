import CommandersPage from "@/pages/main/commanders/commanders";
import { getCommanders } from "@/services/commanders";
import { Commander } from "@/types/entities/commanders";

export default async function Page() {
  const commanders: Commander[] = await getCommanders();
  return <CommandersPage commanders={commanders} />;
}
