import { listConstants } from '../constants/list';
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
    // Set a base text color for the table
    color: 'text.primary',
    '--TableCell-paddingX': listConstants.TABLE_CELL_PADDING_X,

    // Style for table headers
    '& th': {
      fontWeight: 700,
      backgroundColor: 'transparent', // Ensure no background color
      color: 'text.primary', // Ensure header text matches base color
    },

    // Style for table data cells
    '& td': {
      py: listConstants.TABLE_CELL_PADDING_Y,
    },

    // Hover effect for table rows
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
