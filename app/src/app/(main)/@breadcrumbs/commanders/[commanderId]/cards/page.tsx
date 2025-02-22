import type { BreadcrumbSegment } from "@/components/ui/responsive-breadcrumb";
import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { commanderId: string } }>) {
  const _params = await params;
  //   const commander = await fetchCommander({ id: params.commanderId });
  // TODO: Implement commander fetch
  const commander = { name: "Kinnan, Bonder Prodigy", id: _params.commanderId };

  const segments: BreadcrumbSegment[] = [
    { label: "Home", href: "/" },
    { label: "Commanders", href: "/commanders" },
    { label: commander.name, href: `/commanders/${commander.id}` },
    { label: "Cards" }
  ];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
