import { cardConstants } from '../constants/cards';

export const bannerStyles = {
  container: {
    width: '100%',
    bgcolor: 'background.level1',
    borderBottom: '1px solid',
    borderColor: 'divider',
    px: 3,
    py: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    height: `${cardConstants.BANNER_HEIGHT}px`,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
  },
  authorLink: {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
} as const;