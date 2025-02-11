import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default async function BreadcrumbSlot({
  params
}: Readonly<{ params: { commanderId: string } }>) {
  const _params = await params;
  //   const commander = await fetchCommander({ id: params.commanderId });
  // TODO: Implement commander fetch
  const commander = { name: "Kinnan, Bonder Prodigy", id: _params.commanderId };

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
        <BreadcrumbLink href={"/commanders/" + commander.id}>{commander.name}</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Cards</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
} 