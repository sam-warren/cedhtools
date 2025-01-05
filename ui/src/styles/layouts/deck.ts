import { cardConstants } from '../constants/cards';

const GLOW_PADDING = cardConstants.GLOW_SPREAD + cardConstants.GLOW_BLUR;

export const deckPageLayout = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: `calc(100% - ${cardConstants.BANNER_HEIGHT}px)`,
    overflow: 'hidden',
  },
  wrapper: {
    display: 'flex',
    gap: 4,
    flex: 1,
    overflow: 'hidden',
  },
  leftPane: {
    width: '300px',
    flexShrink: 0,
    p: 3,
    overflowY: 'auto',
    height: '100%',
  },
  rightPane: {
    flexGrow: 1,
    minWidth: 0,
    overflowY: 'auto',
    pb: 2,
    pt: 2,
    pr: 4,
    pl: `${GLOW_PADDING}px`, // Add padding for the glow effect
  },
} as const;
