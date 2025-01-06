import { cardConstants } from '../constants/cards';

export const skeletonStyles = {
  card: {
    width: '100%',
    mb: 3,
  },
  cardImage: {
    aspectRatio: cardConstants.CARD_ASPECT_RATIO,
    borderRadius: cardConstants.CORNER_RADIUS,
    width: '100%',
    display: 'block',
  },
  banner: {
    display: 'flex',
    gap: 2,
  },
  section: {
    mb: 4,
  },
} as const;

export const skeletonSections = [
  { type: 'creatures', count: 8 },
  { type: 'instants', count: 6 },
  { type: 'sorceries', count: 4 },
  { type: 'artifacts', count: 3 },
  { type: 'enchantments', count: 5 },
  { type: 'lands', count: 4 },
] as const;
