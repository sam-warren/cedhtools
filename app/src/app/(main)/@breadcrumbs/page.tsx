import type { BreadcrumbSegment } from "@/components/ui/responsive-breadcrumb";
import { ResponsiveBreadcrumbs } from "@/components/ui/responsive-breadcrumb";

export default function BreadcrumbSlot() {
  const segments: BreadcrumbSegment[] = [{ label: "Home" }];

  return <ResponsiveBreadcrumbs segments={segments} />;
}
