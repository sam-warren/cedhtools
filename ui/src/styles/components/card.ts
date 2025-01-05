import { Theme } from '@mui/joy/styles';
import { cardConstants } from '../constants/cards';

export const cardStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    position: 'relative',
  },
  // Base image container without hover effect
  imageContainer: (theme: Theme) => ({
    position: 'relative',
    width: '100%',
    aspectRatio: cardConstants.CARD_ASPECT_RATIO,
    borderRadius: `${cardConstants.CORNER_RADIUS_RATIO * 100}%`,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.level2,
    cursor: 'pointer',
  }),
  // Additional hover styles that can be spread into DeckCard
  deckCardHover: (theme: Theme) => ({
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: `${cardConstants.CORNER_RADIUS_RATIO * 100}%`,
      padding: '3px',
      background: theme.palette.primary.plainColor,
      WebkitMask:
        'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      opacity: 0,
      transition: 'opacity 0.2s ease-in-out',
    },
    '&:hover::before': {
      opacity: 1,
    },
  }),
  banner: (color: string) => ({
    position: 'absolute',
    top: `-${cardConstants.STATS_BANNER_HEIGHT}px`,
    left: 0,
    right: 0,
    height: `${cardConstants.STATS_BANNER_HEIGHT + cardConstants.STATS_CORNER_HEIGHT}px`,
    bgcolor: `${color}.softBg`,
    borderTopLeftRadius: `${cardConstants.CORNER_RADIUS_RATIO * 100}%`,
    borderTopRightRadius: `${cardConstants.CORNER_RADIUS_RATIO * 100}%`,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '4px',
    clipPath: `
        polygon(
          0 0,
          100% 0,
          100% 100%,
          0 100%
        )
      `,
  }),
  titleContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    textAlign: 'center',
  },
} as const;
