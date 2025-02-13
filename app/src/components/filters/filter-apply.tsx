"use client";

import { Button } from "@/components/ui/button";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Filter, Loader } from "lucide-react";
import { useCallback } from "react";

interface FilterApplyProps {
  isLoading: boolean;
  hasModifiedFilters: () => boolean;
  applyFilters: () => void;
  open: boolean;
}

export function FilterApply({ isLoading, hasModifiedFilters, applyFilters, open }: FilterApplyProps) {
  const { toast } = useToast();

  const handleApplyFilters = useCallback(async () => {
    applyFilters();

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Filters applied",
      description: "Data has been filtered based on your selections.",
      variant: "info",
      duration: 3000
    });
  }, [applyFilters, toast]);

  return (
    <SidebarMenuItem className="">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="outline"
              className="h-8 w-full overflow-hidden transition-all duration-200"
              onClick={handleApplyFilters}
              disabled={isLoading || !hasModifiedFilters()}>
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              {open && <span className="ml-2 transition-opacity duration-200">{!isLoading && "Apply Filters"}</span>}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={open}>
          {hasModifiedFilters() ? "Apply Filters" : "No changes to apply"}
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  );
}
