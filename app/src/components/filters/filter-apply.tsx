"use client";

import { Button } from "@/components/ui/button";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Filter, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

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
      description: "Data in the application is filtered based on your selections."
    });
  }, [applyFilters, toast]);

  return (
    <SidebarMenuItem className="mt-2">
      <Button
        variant="outline"
        className="h-8 w-full overflow-hidden transition-all duration-200"
        onClick={handleApplyFilters}
        disabled={isLoading || !hasModifiedFilters()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
        {open && (
          <span className="ml-2 transition-opacity duration-200">
            {isLoading ? "Applying..." : "Apply Filters"}
          </span>
        )}
      </Button>
    </SidebarMenuItem>
  );
} 