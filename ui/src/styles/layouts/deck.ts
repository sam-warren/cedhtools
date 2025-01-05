import { cardConstants } from '../constants/cards';

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
  },
} as const;
