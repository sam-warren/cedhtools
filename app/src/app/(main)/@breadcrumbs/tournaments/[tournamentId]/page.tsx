import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { tournamentId: string } }>) {
  const _params = await params;
  //   const tournament = await fetchTournament({ id: params.tournamentId });
  // TODO: Implement tournament fetch
  const tournament = { name: "The Boil 2" };

  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/tournaments">Tournaments</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="capitalize">{tournament.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}
