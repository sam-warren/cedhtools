import { cn } from "@/lib/utils/cn";
import { ManaSymbol } from "@/components/shared/mana-cost";

interface ColorIdentityProps {
  colorId: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const colorLabels: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

export function ColorIdentity({
  colorId,
  size = "md",
  showLabel = false,
}: ColorIdentityProps) {
  // Handle colorless
  if (!colorId || colorId === "C") {
    return (
      <div className="flex items-center gap-1">
        <ManaSymbol symbol="C" size={size} />
        {showLabel && (
          <span className="text-xs text-muted-foreground">Colorless</span>
        )}
      </div>
    );
  }

  const colors = colorId.split("");

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-0.5">
        {colors.map((color, index) => (
          <ManaSymbol
            key={`${color}-${index}`}
            symbol={color}
            size={size}
            className="drop-shadow-sm"
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {colors.map((c) => colorLabels[c] ?? c).join(" ")}
        </span>
      )}
    </div>
  );
}

// Utility to get color name from identity
export function getColorName(colorId: string): string {
  if (!colorId || colorId === "C") return "Colorless";

  const colorNames = colorId.split("").map((c) => colorLabels[c] ?? c);

  if (colorNames.length === 1) return colorNames[0];
  if (colorNames.length === 2) return colorNames.join(" ");
  if (colorNames.length === 5) return "5-Color";

  return colorNames.join("");
}
