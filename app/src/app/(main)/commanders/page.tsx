import CommandersPage from "@/pages/main/commanders/commanders";
import { getCommanders } from "@/services/commanders";

export default async function Page() {
  const commanders = await getCommanders();
  return <CommandersPage commanders={commanders} />;
}
