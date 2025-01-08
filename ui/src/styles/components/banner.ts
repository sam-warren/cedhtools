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
    // Remove fixed height and let content determine it
    minHeight: `${cardConstants.BANNER_HEIGHT}px`,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
    // Ensure container takes full height
    height: '100%',
    // Add flex positioning to match parent
    justifyContent: 'center',
  },
  authorLink: {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
} as const;
