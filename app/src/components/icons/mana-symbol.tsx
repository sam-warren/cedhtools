import { getManaSymbol, parseManaString } from "@/lib/utils/mana-symbols";
import Image from "next/image";
import React, { useMemo } from "react";

interface ManaSymbolProps {
  symbol: string;
  size?: number;
  className?: string;
}

export const ManaSymbol: React.FC<ManaSymbolProps> = ({ symbol, size = 16, className = "" }) => {
  const symbolData = useMemo(() => getManaSymbol(symbol), [symbol]);

  if (!symbolData) {
    console.warn(`Unknown mana symbol: ${symbol}`);
    return null;
  }

  return (
    <Image
      src={symbolData.svg_uri}
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

export const ManaCost: React.FC<ManaCostProps> = ({ cost, size = 16, className = "" }) => {
  const symbols = useMemo(() => parseManaString(cost), [cost]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {symbols.map((symbol, index) => (
        <ManaSymbol key={`${symbol}-${index}`} symbol={symbol} size={size} />
      ))}
    </div>
  );
};
