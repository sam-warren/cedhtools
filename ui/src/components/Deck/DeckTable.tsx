import { ArrowDown, Filter, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { ICardStat } from 'src/types';

type Order = 'asc' | 'desc';
type OrderBy = 'cmc' | 'win_rate' | 'inclusion_rate';

interface TableProps {
  cards: ICardStat[];
  deckStats: any;
  label: string;
}

const DeckTable: React.FC<TableProps> = ({ cards, deckStats, label }) => {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('win_rate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      let comparison = 0;
      switch (orderBy) {
        case 'cmc':
          comparison = a.cmc - b.cmc;
          break;
        case 'win_rate':
          comparison = a.performance.win_rate_diff - b.performance.win_rate_diff;
          break;
        case 'inclusion_rate':
          comparison = a.performance.inclusion_rate - b.performance.inclusion_rate;
          break;
      }
      return order === 'asc' ? comparison : -comparison;
    });
  }, [cards, order, orderBy]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{label}</h3>
          <div className="flex gap-2">
            {/* Add your filter controls here */}
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Card
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('cmc')}
              >
                CMC
                {orderBy === 'cmc' && (
                  <ArrowDown className={`inline-block w-4 h-4 ml-1 transform ${order === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </th>
              {/* Add more table headers */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedCards
              .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
              .map((card) => (
                <tr 
                  key={card.unique_card_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => navigate(`card/${card.unique_card_id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {card.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {card.cmc}
                  </td>
                  {/* Add more table cells */}
                </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-4">
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * rowsPerPage >= cards.length}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckTable;
