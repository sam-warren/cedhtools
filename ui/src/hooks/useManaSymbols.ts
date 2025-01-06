// src/hooks/useManaSymbols.ts
import { useMemo } from 'react';
import { useAppSelector } from './useAppSelector';

export function useManaSymbols() {
  const { symbols, status } = useAppSelector((state) => state.symbology);

  const renderManaSymbols = useMemo(
    () => (manaCost: string | null) => {
      if (!manaCost) return null;
      const symbolMatches = manaCost.match(/\{[^}]+\}/g) || [];

      return symbolMatches.map((symbol, index) => {
        const svgUrl = symbols[symbol];
        return {
          key: `${symbol}-${index}`,
          symbol,
          svgUrl,
        };
      });
    },
    [symbols],
);

  return {
    renderManaSymbols,
    isLoading: status === 'loading',
    isError: status === 'failed',
  };
}
