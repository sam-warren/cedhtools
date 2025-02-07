import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { commanderId: string } }>) {
  const _params = await params;
  //   const commander = await fetchCommander({ id: _params.commanderId });
  // TODO: Implement commander fetch
  const commander = { name: "Kinnan, Bonder Prodigy" };

  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/commanders">Commanders</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="capitalize">{commander.name}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
}
