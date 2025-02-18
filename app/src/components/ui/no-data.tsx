import { FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/stores/filter-store";
import { DATE_PRESET, TOURNAMENT_SIZE, TOP_CUT } from "@/lib/constants/filters";
import { useState } from "react";

interface NoDataProps {
  message?: string;
  suggestion?: string;
}

export function NoData({
  message = "No data available for the selected filters",
  suggestion = "Try adjusting your filters to see more data"
}: NoDataProps) {
  const { setDatePreset, setTournamentSize, setTopCut, applyFilters } = useFilterStore();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetFilters = async () => {
    setIsResetting(true);
    try {
      // Reset to default values
      setDatePreset(DATE_PRESET.POST_BAN);
      setTournamentSize(TOURNAMENT_SIZE.THIRTY_PLUS);
      setTopCut([TOP_CUT.TOP_4, TOP_CUT.TOP_10, TOP_CUT.TOP_16]);
      
      // Apply the changes
      await applyFilters();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-6 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">{message}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{suggestion}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={handleResetFilters}
          disabled={isResetting}
        >
          {isResetting ? "Resetting..." : "Reset Filters"}
        </Button>
      </CardContent>
    </Card>
  );
}
