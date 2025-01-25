import { Grid, List } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { setDeckViewMode } from 'src/store/slices/uiSlice';

export default function DeckViewToggle() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.ui.deckViewMode);

  const handleViewChange = (newView: 'grid' | 'list') => {
    dispatch(setDeckViewMode(newView));
  };

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => handleViewChange('grid')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleViewChange('list')}
        className={`p-2 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}