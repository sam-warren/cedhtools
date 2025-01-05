// src/styles/cardStyles.ts
import { Theme } from '@mui/joy/styles';
import { cardConstants } from '../constants/cards';

type CardVariant = 'deck' | 'commander';

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
  imageContainer: (theme: Theme, variant: CardVariant = 'deck') => ({
    position: 'relative',
    width: '100%',
    aspectRatio: cardConstants.CARD_ASPECT_RATIO,
    borderRadius: `${cardConstants.CORNER_RADIUS}px`,
    overflow: variant === 'deck' ? 'visible' : 'hidden',
    backgroundColor: 'transparent',
    cursor: variant === 'deck' ? 'pointer' : 'default',
    zIndex: 2,
    ...(variant === 'deck' && {
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: `${cardConstants.CORNER_RADIUS}px`,
        opacity: 0,
        transition: 'opacity 0.2s ease-in-out',
        pointerEvents: 'none',
        zIndex: 3,
        boxShadow: `
          inset 0 0 0 ${cardConstants.INNER_BORDER_WIDTH}px ${theme.palette.primary.softActiveBg},
          0 0 ${cardConstants.GLOW_BLUR}px ${cardConstants.GLOW_SPREAD}px ${theme.palette.primary.softActiveBg}
        `,
      },
      '&:hover::before': {
        opacity: 1,
      },
    }),
    '& img': {
      borderRadius: `${cardConstants.CORNER_RADIUS}px`,
      maskImage: 'linear-gradient(black, black)', // Fix for Safari border-radius clipping
      WebkitMaskImage: 'linear-gradient(black, black)', // Fix for Safari border-radius clipping
    },
  }),
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    borderRadius: `${cardConstants.CORNER_RADIUS}px`,
    position: 'relative',
    zIndex: 2,
  },
  banner: (color: string) => ({
    position: 'absolute',
    top: `-${cardConstants.STATS_BANNER_HEIGHT}px`,
    left: 0,
    right: 0,
    height: `${cardConstants.STATS_BANNER_HEIGHT + cardConstants.STATS_CORNER_HEIGHT}px`,
    bgcolor: `${color}.softBg`,
    borderTopLeftRadius: `${cardConstants.CORNER_RADIUS}px`,
    borderTopRightRadius: `${cardConstants.CORNER_RADIUS}px`,
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
