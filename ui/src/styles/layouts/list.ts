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
    position: 'relative',
    backgroundColor: 'background.surface',
  },
  sectionHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'background.surface',
    zIndex: 3,
    py: listConstants.SECTION_PADDING_Y,
    borderBottom: '1px solid',
    borderColor: 'divider',
  },
  tableContainer: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'background.surface',
  },
};
