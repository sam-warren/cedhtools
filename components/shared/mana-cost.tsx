import { cn } from "@/lib/utils/cn";
import symbologyData from "@/data/symbology.json";

interface ManaCostProps {
  cost: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Build a lookup map from symbol to SVG URL
const symbolToSvg = new Map<string, string>();
for (const symbol of symbologyData.data) {
  symbolToSvg.set(symbol.symbol, symbol.svg_uri);
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

/**
 * Parse mana cost string like "{2}{U}{B}" into array of symbols
 */
function parseManaCost(cost: string): string[] {
  const symbols: string[] = [];
  const regex = /\{[^}]+\}/g;
  let match;
  
  while ((match = regex.exec(cost)) !== null) {
    symbols.push(match[0]);
  }
  
  return symbols;
}

/**
 * Renders mana cost as Scryfall SVG symbols
 */
export function ManaCost({ cost, size = "md", className }: ManaCostProps) {
  if (!cost) return null;
  
  const symbols = parseManaCost(cost);
  
  if (symbols.length === 0) return null;
  
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {symbols.map((symbol, index) => {
        const svgUrl = symbolToSvg.get(symbol);
        
        if (!svgUrl) {
          // Fallback: render as text
          return (
            <span
              key={`${symbol}-${index}`}
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-muted text-xs font-mono",
                sizeMap[size]
              )}
            >
              {symbol.replace(/[{}]/g, "")}
            </span>
          );
        }
        
        return (
          <img
            key={`${symbol}-${index}`}
            src={svgUrl}
            alt={symbol}
            className={cn(sizeMap[size], "inline-block")}
            loading="lazy"
          />
        );
      })}
    </span>
  );
}

/**
 * Renders a single mana symbol
 */
export function ManaSymbol({ 
  symbol, 
  size = "md",
  className 
}: { 
  symbol: string; 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  // Normalize symbol to have braces
  const normalizedSymbol = symbol.startsWith("{") ? symbol : `{${symbol}}`;
  const svgUrl = symbolToSvg.get(normalizedSymbol);
  
  if (!svgUrl) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted text-xs font-mono",
          sizeMap[size],
          className
        )}
      >
        {symbol.replace(/[{}]/g, "")}
      </span>
    );
  }
  
  return (
    <img
      src={svgUrl}
      alt={normalizedSymbol}
      className={cn(sizeMap[size], "inline-block", className)}
      loading="lazy"
    />
  );
}

