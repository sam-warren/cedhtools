import { cardConstants } from '../constants/cards';

export const gridLayouts = {
  cardGrid: {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: `repeat(auto-fill, ${cardConstants.CARD_WIDTH}px)`,
    justifyContent: 'start',
    pt: 3,
  },
  sectionGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    width: '100%',
  },
} as const;