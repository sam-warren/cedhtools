import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";
import type { BreadcrumbSegment } from "@/components/ui/responsive-breadcrumb";

export default async function BreadcrumbSlot({
  params
}: Readonly<{ params: { commanderId: string; cardId: string } }>) {
  const _params = await params;
  //   const commander = await fetchCommander({ id: params.commanderId });
  // TODO: Implement commander and card fetch
  const commander = { name: "Kinnan, Bonder Prodigy", id: _params.commanderId };
  const card = { name: "Basalt Monolith", id: _params.cardId };

  const segments: BreadcrumbSegment[] = [
    { label: "Home", href: "/" },
    { label: "Commanders", href: "/commanders" },
    { label: commander.name, href: `/commanders/${commander.id}` },
    { label: "Cards", href: `/commanders/${commander.id}/cards` },
    { label: card.name }
  ];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
