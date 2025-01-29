import React, { useMemo } from "react";
import {
  parseManaString,
  getManaSymbol,
  getSvgBaseUrl,
} from "@/lib/mana-symbols/utils";
import Image from "next/image";

interface ManaSymbolProps {
  symbol: string;
  size?: number;
  className?: string;
}

export const ManaSymbol: React.FC<ManaSymbolProps> = ({
  symbol,
  size = 16,
  className = "",
}) => {
  const symbolData = useMemo(() => getManaSymbol(symbol), [symbol]);

  if (!symbolData) {
    console.warn(`Unknown mana symbol: ${symbol}`);
    return null;
  }

  // Extract just the filename from the SVG URI
  const svgFilename = symbolData.svg_uri.split("/").pop();

  return (
    <Image
      src={`${getSvgBaseUrl()}${svgFilename}`}
      alt={symbolData.english}
      width={size}
      height={size}
      className={`inline-block ${className}`}
    />
  );
};

interface ManaCostProps {
  cost: string;
  size?: number;
  className?: string;
}

export const ManaCost: React.FC<ManaCostProps> = ({
  cost,
  size = 16,
  className = "",
}) => {
  const symbols = useMemo(() => parseManaString(cost), [cost]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {symbols.map((symbol, index) => (
        <ManaSymbol key={`${symbol}-${index}`} symbol={symbol} size={size} />
      ))}
    </div>
  );
};
