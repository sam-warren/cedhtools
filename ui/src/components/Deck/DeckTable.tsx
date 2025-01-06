import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Box,
  Table,
  Typography,
  Chip,
  Button,
  Input,
  IconButton,
  Sheet,
  FormControl,
  FormLabel,
  Select,
  Option,
} from '@mui/joy';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { ICardStat } from 'src/types';
import { useNavigate } from 'react-router-dom';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InboxIcon from '@mui/icons-material/Inbox';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { chipStyles, tableStyles } from 'src/styles/components/list';
import debounce from 'lodash/debounce';

/* ================================
   Type Definitions
   ================================ */

type Order = 'asc' | 'desc';
type OrderBy = 'cmc' | 'win_rate' | 'inclusion_rate';

type ManaSymbol = {
  key: string;
  symbol: string;
  svgUrl: string | undefined;
};

interface SortConfig {
  order: Order;
  orderBy: OrderBy | null;
}

interface FilterConfig {
  name: string;
  minWinRate: number | '';
  minInclusionRate: number | '';
}

/* ================================
   Utility Functions
   ================================ */

/**
 * Comparator function for descending order.
 */
const descendingComparator = <T extends unknown>(
  a: T,
  b: T,
  orderBy: keyof T,
) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

/**
 * Returns a comparator function based on order and orderBy.
 */
const getComparator = (order: Order, orderBy: OrderBy) => {
  return order === 'desc'
    ? (a: ICardStat, b: ICardStat) => {
        switch (orderBy) {
          case 'cmc':
            return descendingComparator(a, b, 'cmc');
          case 'win_rate':
            return descendingComparator(
              a.performance,
              b.performance,
              'card_win_rate',
            );
          case 'inclusion_rate':
            return descendingComparator(a, b, 'decks_with_card');
          default:
            return 0;
        }
      }
    : (a: ICardStat, b: ICardStat) => {
        switch (orderBy) {
          case 'cmc':
            return -descendingComparator(a, b, 'cmc');
          case 'win_rate':
            return -descendingComparator(
              a.performance,
              b.performance,
              'card_win_rate',
            );
          case 'inclusion_rate':
            return -descendingComparator(a, b, 'decks_with_card');
          default:
            return 0;
        }
      };
};

/* ================================
   Sub-components
   ================================ */

/**
 * SortableColumnHeader Component
 */
const SortableColumnHeader = ({
  label,
  property,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  property: OrderBy;
  sort: SortConfig;
  onSort: (property: OrderBy) => void;
  align?: 'left' | 'right';
}) => {
  const active = sort.orderBy === property;

  return (
    <Box
      onClick={() => onSort(property)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        color: active ? 'primary.plainColor' : undefined,
        '&:hover': {
          '& svg': { opacity: 0.5 },
        },
      }}
    >
      {label}
      <ArrowDownwardIcon
        sx={{
          opacity: active ? 1 : 0,
          transition: '0.2s',
          transform:
            active && sort.order === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)',
          width: 18,
          height: 18,
          color: active ? 'primary.plainColor' : undefined,
        }}
      />
      {active && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          {sort.order === 'desc' ? 'sorted descending' : 'sorted ascending'}
        </Box>
      )}
    </Box>
  );
};

/* ================================
   Main Component: DeckTable
   ================================ */

const DeckTable = ({
  cards,
  deckStats,
  label = 'Cards',
}: {
  cards: ICardStat[];
  deckStats: any;
  label: string;
}) => {
  /* --------------------------------
     State Definitions
     -------------------------------- */
  const [sort, setSort] = useState<SortConfig>({ order: 'asc', orderBy: null });
  const [filters, setFilters] = useState<FilterConfig>({
    name: '',
    minWinRate: '',
    minInclusionRate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [workerProcessedCards, setWorkerProcessedCards] = useState(cards);

  /* --------------------------------
     Hooks
     -------------------------------- */
  const navigate = useNavigate();
  const { renderManaSymbols } = useManaSymbols();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/cardFilter.worker.ts?worker', import.meta.url),
    );

    workerRef.current.onmessage = (e) => {
      setWorkerProcessedCards(e.data);
    };

    return () => workerRef.current?.terminate();
  }, []);

  /* --------------------------------
     Handlers
     -------------------------------- */

  /**
   * Handles sorting request.
   */
  const handleRequestSort = useCallback(
    (property: OrderBy) => {
      const isAsc = sort.orderBy === property && sort.order === 'asc';
      setSort({ order: isAsc ? 'desc' : 'asc', orderBy: property });
      setPage(0); // Reset to first page when sorting
    },
    [sort],
  );

  /**
   * Debounced function to send messages to the worker.
   */
  const debouncedWorkerMessage = useMemo(
    () =>
      debounce(
        (message: {
          cards: ICardStat[];
          filters: FilterConfig;
          totalDecks: number;
        }) => {
          workerRef.current?.postMessage(message);
        },
        150,
      ), // Lower debounce time for worker
    [],
  );

  /**
   * Effect to handle filtering.
   */
  useEffect(() => {
    if (!workerRef.current) return;

    // Skip worker if no filters are active
    if (
      !filters.name &&
      filters.minWinRate === '' &&
      filters.minInclusionRate === ''
    ) {
      setWorkerProcessedCards(cards);
      return;
    }

    debouncedWorkerMessage({
      cards,
      filters,
      totalDecks: deckStats.meta_statistics.sample_size.total_decks,
    });
  }, [
    filters,
    cards,
    deckStats.meta_statistics.sample_size.total_decks,
    debouncedWorkerMessage,
  ]);

  /**
   * Handles changes in filter inputs.
   */
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterConfig>) => {
      // Update UI immediately
      setFilters((prev) => {
        const updatedFilters = { ...prev, ...newFilters };

        // Then send to worker with a delay
        debouncedWorkerMessage({
          cards,
          filters: updatedFilters,
          totalDecks: deckStats.meta_statistics.sample_size.total_decks,
        });

        return updatedFilters;
      });
      setPage(0);
    },
    [
      cards,
      deckStats.meta_statistics.sample_size.total_decks,
      debouncedWorkerMessage,
    ],
  );

  /* --------------------------------
     Computed Values
     -------------------------------- */

  /**
   * Sorts the processed cards based on the current sort configuration.
   */
  const processedCards = useMemo(() => {
    if (!sort.orderBy) return workerProcessedCards;
    return [...workerProcessedCards].sort(
      getComparator(sort.order, sort.orderBy),
    );
  }, [workerProcessedCards, sort]);

  /**
   * Paginates the sorted cards.
   */
  const paginatedCards = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return processedCards.slice(startIndex, startIndex + rowsPerPage);
  }, [processedCards, page, rowsPerPage]);

  /* --------------------------------
     Render Functions
     -------------------------------- */

  /**
   * Renders the mana cost with appropriate symbols.
   */
  const renderManaCost = useCallback(
    (manaCost: string | null) => {
      if (!manaCost) return null;

      const sides = manaCost.split('//').map((side) => side.trim());

      return sides.length > 1 && sides[0] && sides[1] ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ManaSymbolsDisplay symbols={renderManaSymbols(sides[0])} />
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            //
          </Typography>
          <ManaSymbolsDisplay symbols={renderManaSymbols(sides[1])} />
        </Box>
      ) : (
        <ManaSymbolsDisplay symbols={renderManaSymbols(manaCost)} />
      );
    },
    [renderManaSymbols],
  );

  /**
   * Displays mana symbols.
   */
  const ManaSymbolsDisplay = ({
    symbols,
  }: {
    symbols: ManaSymbol[] | null;
  }) => {
    if (!symbols) return null;

    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {symbols.map(({ key, symbol, svgUrl }) =>
          svgUrl ? (
            <img
              key={key}
              src={svgUrl}
              alt={symbol}
              style={{
                width: '16px',
                height: '16px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <span key={key}>{symbol}</span>
          ),
        )}
      </Box>
    );
  };

  /**
   * Renders the win rate chip with appropriate styling.
   */
  const renderWinRateChip = useCallback((winRateDiff: number) => {
    const formattedDiff =
      Math.abs(winRateDiff) < 0.005 ? 0 : winRateDiff.toFixed(2);
    const isZero = Number(formattedDiff) === 0;
    const isPositive = Number(formattedDiff) > 0;

    return (
      <Chip
        variant={chipStyles.win_rate.variant}
        color={chipStyles.win_rate.getColor(isZero, isPositive)}
        size="sm"
      >
        {isPositive ? '+' : ''}
        {formattedDiff}%
      </Chip>
    );
  }, []);

  /**
   * Renders the filter inputs.
   */
  const renderFilters = () => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Input
        size="sm"
        placeholder="card name"
        value={filters.name}
        onChange={(e) => handleFilterChange({ name: e.target.value })}
      />
      <Input
        size="sm"
        type="number"
        placeholder="min win %"
        value={filters.minWinRate}
        onChange={(e) =>
          handleFilterChange({
            minWinRate: e.target.value ? Number(e.target.value) : '',
          })
        }
      />
      <Input
        size="sm"
        type="number"
        placeholder="min inclusion %"
        value={filters.minInclusionRate}
        onChange={(e) =>
          handleFilterChange({
            minInclusionRate: e.target.value ? Number(e.target.value) : '',
          })
        }
      />
    </Box>
  );

  /* --------------------------------
     JSX Return
     -------------------------------- */

  return (
    <Sheet
      variant="outlined"
      color="neutral"
      sx={{
        width: '100%',
        boxShadow: 'sm',
        borderRadius: 'sm',
        overflow: 'auto',
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          gap: 2,
        }}
      >
        <Typography level="title-lg">{label}</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ml: 'auto' }}>
          {showFilters && renderFilters()}
          <IconButton
            size="sm"
            variant="outlined"
            color="neutral"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterListIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Table Section */}
      <Table variant="plain" size="sm" sx={tableStyles.root}>
        <thead>
          <tr>
            <th style={{ width: '100px' }}>
              <SortableColumnHeader
                label="Mana Cost"
                property="cmc"
                sort={sort}
                onSort={handleRequestSort}
              />
            </th>
            <th style={{ width: '150px' }}>Name</th>
            <th style={{ width: '180px' }}>Type</th>
            <th style={{ width: '80px' }}>
              <SortableColumnHeader
                label="Win Rate"
                property="win_rate"
                sort={sort}
                onSort={handleRequestSort}
              />
            </th>
            <th style={{ width: '120px', textAlign: 'right' }}>
              <SortableColumnHeader
                label="Inclusion Rate"
                property="inclusion_rate"
                sort={sort}
                onSort={handleRequestSort}
                align="right"
              />
            </th>
            <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCards.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 1,
                  }}
                >
                  <InboxIcon
                    sx={{ fontSize: '3rem', mb: 1, color: 'neutral.400' }}
                  />
                  <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
                    no data
                  </Typography>
                </Box>
              </td>
            </tr>
          ) : (
            paginatedCards.map((card) => (
              <tr key={card.unique_card_id}>
                <td>{renderManaCost(card.mana_cost)}</td>
                <td>
                  <Typography level="body-sm">{card.name}</Typography>
                </td>
                <td>
                  <Typography level="body-sm">{card.type_line}</Typography>
                </td>
                <td>{renderWinRateChip(card.performance.win_rate_diff)}</td>
                <td style={{ textAlign: 'right' }}>
                  <Typography level="body-sm">
                    {(
                      (card.decks_with_card /
                        deckStats.meta_statistics.sample_size.total_decks) *
                      100
                    ).toFixed(1)}
                    %
                  </Typography>
                  <Typography level="body-xs">
                    ({card.decks_with_card} decks)
                  </Typography>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Button
                    variant="plain"
                    color="primary"
                    size="sm"
                    startDecorator={<InfoOutlinedIcon />}
                    onClick={() => navigate(`/cards/${card.unique_card_id}`)}
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>

        {/* Footer Section */}
        <tfoot>
          <tr>
            <td colSpan={6}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  justifyContent: 'flex-end',
                  pr: 2,
                }}
              >
                {/* Rows Per Page Selector */}
                <FormControl orientation="horizontal" size="sm">
                  <FormLabel sx={{ pr: 2 }}>Rows per page:</FormLabel>
                  <Select
                    onChange={(_, value) => {
                      setRowsPerPage(value as number);
                      setPage(0);
                    }}
                    value={rowsPerPage}
                    sx={{ minWidth: 65 }} // control the width
                  >
                    <Option value={5}>5</Option>
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                  </Select>
                </FormControl>

                {/* Pagination Info */}
                <Typography level="body-sm" sx={{ minWidth: 80 }}>
                  {processedCards.length > 0
                    ? `${page * rowsPerPage + 1}–${Math.min(
                        (page + 1) * rowsPerPage,
                        processedCards.length,
                      )} of ${processedCards.length}`
                    : '0–0 of 0'}
                </Typography>

                {/* Pagination Controls */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="sm"
                    color="neutral"
                    variant="outlined"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <KeyboardArrowLeftIcon />
                  </IconButton>
                  <IconButton
                    size="sm"
                    color="neutral"
                    variant="outlined"
                    disabled={
                      page >= Math.ceil(processedCards.length / rowsPerPage) - 1
                    }
                    onClick={() => setPage(page + 1)}
                  >
                    <KeyboardArrowRightIcon />
                  </IconButton>
                </Box>
              </Box>
            </td>
          </tr>
        </tfoot>
      </Table>
    </Sheet>
  );
};

/* ================================
   Export Component
   ================================ */

export default React.memo(DeckTable);
