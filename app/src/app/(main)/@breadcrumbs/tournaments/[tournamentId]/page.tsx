import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { tournamentId: string } }>) {
  const _params = await params;
  //   const tournament = await fetchTournament({ id: _params.tournamentId });
  // TODO: Implement tournament fetch
  const tournament = { name: "The Boil 2" };

  const segments = [
    { label: "Home", href: "/" },
    { label: "Tournaments", href: "/tournaments" },
    { label: tournament.name }
  ];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
