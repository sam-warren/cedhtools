import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";
import type { BreadcrumbSegment } from "@/components/ui/responsive-breadcrumb";

export default async function BreadcrumbSlot({ params }: Readonly<{ params: { all: string[] } }>) {
  const _params = await params;

  const segments: BreadcrumbSegment[] = [
    { label: "Home", href: "/" },
    ..._params.all.map((route, index) => ({
      label: route,
      href: index < _params.all.length - 1 ? `/${_params.all.slice(0, index + 1).join("/")}` : undefined
    }))
  ];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
