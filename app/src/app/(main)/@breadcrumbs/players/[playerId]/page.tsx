import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { playerId: string } }>) {
  const _params = await params;
  //   const player = await fetchPlayer({ id: _params.playerId });
  // TODO: Implement player fetch
  const player = { name: "John Doe" };

  const segments = [
    { label: "Home", href: "/" },
    { label: "Players", href: "/players" },
    { label: player.name }
  ];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
