import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { playerId: string } }>) {
  const _params = await params;
  //   const commander = await fetchCommander({ id: params.commanderId });
  // TODO: Implement commander fetch
  const player = { name: "John Doe" };

  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/players">Players</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="capitalize">{player.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}
