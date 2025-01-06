import { listConstants } from '../constants/list';

export const layoutStyles = {
  container: {
    width: '100%',
  },
  mainSection: {
    mb: 6,
  },
  sectionContainer: {
    mb: 4,
    // Remove backgroundColor from here
  },
  sectionHeader: {
    py: listConstants.SECTION_PADDING_Y,
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  tableContainer: {
    // No background color needed here either
  },
};
