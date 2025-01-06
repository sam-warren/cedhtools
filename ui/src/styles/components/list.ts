import { listConstants } from '../constants/list';
import type { Theme } from '@mui/joy/styles';
import { ChipProps } from '@mui/joy/Chip';

export const chipStyles = {
  win_rate: {
    variant: 'soft' as const,
    getColor: (isZero: boolean, isPositive: boolean): ChipProps['color'] =>
      isZero ? 'primary' : isPositive ? 'success' : 'danger',
  },
};

export const tableStyles = {
  root: {
    '--TableCell-paddingX': listConstants.TABLE_CELL_PADDING_X,
    position: 'relative',
    '& thead': {
      position: 'sticky',
      top: `${listConstants.SECTION_HEADER_HEIGHT}px`,
      backgroundColor: 'background.surface',
      zIndex: 2,
      boxShadow: (theme: Theme) => `0 1px 0 ${theme.vars.palette.divider}`,
    },
    '& th': {
      fontWeight: 600,
      backgroundColor: 'background.surface',
    },
    '& td': {
      py: listConstants.TABLE_CELL_PADDING_Y,
      borderBottom: '1px solid',
      borderColor: 'divider',
    },
    '& tr:hover': {
      backgroundColor: `rgba(0, 0, 0, ${listConstants.ROW_HOVER_OPACITY})`,
    },
  },
};

export const typographyStyles = {
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    '&::before': {
      content: '""',
      width: listConstants.ACCENT_BAR_WIDTH,
      height: listConstants.ACCENT_BAR_HEIGHT,
      backgroundColor: 'primary.main',
      borderRadius: 1,
    },
  },
  mainTitle: {
    mb: 3,
    fontSize: '1.75rem',
    fontWeight: 'bold',
  },
};