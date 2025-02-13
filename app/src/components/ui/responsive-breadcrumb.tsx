import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
} from "@/components/ui/breadcrumb";
import React from "react";
import type { ReactElement } from "react";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

interface ResponsiveBreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export function ResponsiveBreadcrumbs({ segments }: ResponsiveBreadcrumbsProps) {
  if (!segments.length) return null;

  const parentSegment = segments.length > 1 ? segments[segments.length - 2] : { href: "/" };
  const currentSegment = segments[segments.length - 1];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Mobile view - only last segment with ellipsis */}
        <div className="flex items-center md:hidden">
          <BreadcrumbLink href={parentSegment.href} className="flex items-center -ml-2">
            <BreadcrumbEllipsis className="w-8" />
          </BreadcrumbLink>
          <BreadcrumbSeparator className="mx-2" />
          <span className="capitalize">{currentSegment.label}</span>
        </div>

        {/* Desktop: Full breadcrumb trail */}
        <div className="hidden md:flex md:items-center [&_li]:mx-1">
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;

            return (
              <React.Fragment key={segment.href || segment.label}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="capitalize">{segment.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={segment.href} className="capitalize">
                      {segment.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </div>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
