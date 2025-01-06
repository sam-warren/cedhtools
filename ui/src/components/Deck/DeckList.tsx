import { Box, Table, Typography, Chip, Button } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import { useManaSymbols } from 'src/hooks/useManaSymbols';
import { cardTypeMap } from 'src/styles';
import { ICardStat } from 'src/types';
import { useNavigate } from 'react-router-dom';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  chipStyles,
  tableStyles,
  typographyStyles,
} from 'src/styles/components/list';
import { layoutStyles } from 'src/styles/layouts/list';

type ManaSymbol = {
  key: string;
  symbol: string;
  svgUrl: string | undefined;
};

const ManaSymbolsDisplay = ({ symbols }: { symbols: ManaSymbol[] | null }) => {
  if (!symbols) return null;
  
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {symbols.map(({ key, symbol, svgUrl }) => (
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
        )
      ))}
    </Box>
  );
};

export default function DeckList() {
  const { deckStats } = useAppSelector((state) => state.deck);
  const { renderManaSymbols, isLoading, isError } = useManaSymbols();
  const navigate = useNavigate();

  if (!deckStats) return null;
  if (isLoading) return <div>Loading mana symbols...</div>;
  if (isError) return <div>Error loading mana symbols</div>;

  const renderManaCost = (manaCost: string | null) => {
    if (!manaCost) return null;

    const sides = manaCost.split('//').map(side => side.trim());
    
    if (sides.length > 1 && sides[0] && sides[1]) {
      // Both sides have mana costs
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ManaSymbolsDisplay symbols={renderManaSymbols(sides[0])} />
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>//</Typography>
          <ManaSymbolsDisplay symbols={renderManaSymbols(sides[1])} />
        </Box>
      );
    }

    // Single sided card or only one side has mana cost
    return <ManaSymbolsDisplay symbols={renderManaSymbols(manaCost)} />;
  };

  const renderWinRateChip = (cardWinRate: number, baselineWinRate: number) => {
    const winRateDiff = (cardWinRate - baselineWinRate) * 100;
    const formattedDiff =
      Math.abs(winRateDiff) < 0.005 ? 0 : winRateDiff.toFixed(2);
    const isZero = Number(formattedDiff) === 0;
    const isPositive = Number(formattedDiff) > 0;

    return (
      <Chip
        variant={chipStyles.win_rate.variant}
        color={chipStyles.win_rate.getColor(isZero, isPositive)}
      >
        {isPositive ? '+' : ''}
        {formattedDiff}%
      </Chip>
    );
  };

  const renderCardTable = (cards: ICardStat[]) => (
    <Table variant="soft" size="sm" sx={tableStyles.root}>
      <thead>
        <tr>
          <th style={{ width: '100px' }}>Mana Cost</th>
          <th style={{ width: '150px' }}>Name</th>
          <th style={{ width: '180px' }}>Type</th>
          <th style={{ width: '70px' }}>Win Rate</th>
          <th style={{ width: '120px', textAlign: 'right' }}>Inclusion Rate</th>
          <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {cards.map((card) => (
          <tr key={card.unique_card_id}>
            <td>{renderManaCost(card.mana_cost)}</td>
            <td>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {card.name}
              </Box>
            </td>
            <td>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {card.type_line}
              </Typography>
            </td>
            <td>
              {renderWinRateChip(
                card.performance.card_win_rate,
                deckStats.meta_statistics.baseline_performance.win_rate,
              )}
            </td>
            <td style={{ textAlign: 'right' }}>
              {(
                (card.decks_with_card /
                  deckStats.meta_statistics.sample_size.total_decks) *
                100
              ).toFixed(1)}
              %
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                ({card.decks_with_card} decks)
              </Typography>
            </td>
            <td style={{ textAlign: 'center' }}>
              <Button
                variant="plain"
                color="neutral"
                size="sm"
                startDecorator={<InfoOutlinedIcon />}
                onClick={() => navigate(`/cards/${card.unique_card_id}`)}
              >
                Details
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderMainSection = (typeCode: string, cards: ICardStat[]) => (
    <Box key={typeCode} sx={layoutStyles.sectionContainer}>
      <Box sx={layoutStyles.sectionHeader}>
        <Typography level="h2" sx={typographyStyles.sectionTitle}>
          {cardTypeMap[typeCode] || `Type ${typeCode}`}
        </Typography>
      </Box>

      <Box sx={layoutStyles.tableContainer}>{renderCardTable(cards)}</Box>
    </Box>
  );

  return (
    <Box sx={layoutStyles.container}>
      <Box sx={layoutStyles.mainSection}>
        <Typography level="h1" sx={typographyStyles.mainTitle}>
          Main Deck
        </Typography>
        {Object.entries(deckStats.card_statistics.main)
          .filter(([, cards]) => cards.length > 0)
          .map(([typeCode, cards]) => renderMainSection(typeCode, cards))}
      </Box>

      {deckStats.card_statistics.other.length > 0 && (
        <Box>
          <Typography level="h1" sx={typographyStyles.mainTitle}>
            Other Cards
          </Typography>
          {renderCardTable(deckStats.card_statistics.other)}
        </Box>
      )}
    </Box>
  );
}