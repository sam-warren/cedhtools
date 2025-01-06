// cardFilter.worker.ts
type FilterConfig = {
  name: string;
  minWinRate: number | '';
  minInclusionRate: number | '';
};

interface ICardStat {
  name: string;
  performance: {
    card_win_rate: number;
  };
  decks_with_card: number;
  mana_cost: string | null;
  type_line: string;
  unique_card_id: string;
}

interface WorkerMessage {
  cards: ICardStat[];
  filters: FilterConfig;
  totalDecks: number;
}
let currentFilterOperation: number | null = null;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const operationId = Date.now();
  currentFilterOperation = operationId;

  const { cards, filters, totalDecks } = e.data;

  // Run filtering in next tick to allow message queue to clear
  setTimeout(() => {
    // If this operation has been superseded, abandon it
    if (currentFilterOperation !== operationId) return;

    let results = cards;

    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      results = results.filter((card) =>
        card.name.toLowerCase().includes(searchTerm),
      );
    }

    if (filters.minWinRate !== '') {
      const threshold = filters.minWinRate / 100;
      results = results.filter(
        (card) => card.performance.card_win_rate >= threshold,
      );
    }

    if (filters.minInclusionRate !== '') {
      const threshold = filters.minInclusionRate;
      results = results.filter(
        (card) => (card.decks_with_card / totalDecks) * 100 >= threshold,
      );
    }

    // If this operation is still current, send results
    if (currentFilterOperation === operationId) {
      self.postMessage(results);
    }
  }, 0);
};
