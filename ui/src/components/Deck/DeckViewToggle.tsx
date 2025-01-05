// src/components/Deck/ViewToggle.tsx
import { ToggleButtonGroup, IconButton } from '@mui/joy';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { setDeckViewMode } from 'src/store/uiSlice';

export default function DeckViewToggle() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);

  const handleViewChange = (newView: 'grid' | 'list') => {
    if (newView) {
      dispatch(setDeckViewMode(newView));
    }
  };

  return (
    <ToggleButtonGroup
      value={viewMode}
      onChange={(_, value) => value && handleViewChange(value)}
      size="sm"
      color="neutral"
      variant="soft"
    >
      <IconButton value="grid">
        <GridViewRoundedIcon />
      </IconButton>
      <IconButton value="list">
        <ViewListRoundedIcon />
      </IconButton>
    </ToggleButtonGroup>
  );
}