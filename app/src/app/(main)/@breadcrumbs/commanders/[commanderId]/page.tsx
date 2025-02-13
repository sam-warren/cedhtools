import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { commanderId: string } }>) {
  const _params = await params;
  //   const commander = await fetchCommander({ id: _params.commanderId });
  // TODO: Implement commander fetch
  const commander = { name: "Kinnan, Bonder Prodigy" };

  const segments = [
    { label: "Home", href: "/" },
    { label: "Commanders", href: "/commanders" },
    { label: commander.name }
  ];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
