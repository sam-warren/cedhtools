import { useSearchHistory } from 'src/contexts/SearchHistoryContext';
import { Link } from 'react-router-dom';
import { ISearchHistoryEntry } from 'src/types';

export default function SearchHistory() {
  const { searchHistory, clearSearchHistory } = useSearchHistory();

  if (searchHistory.length === 0) {
    return null;
  }

  return (
    <div className="max-w-[700px] w-full mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xl font-semibold">recently searched decks</h4>
        <button
          onClick={() => clearSearchHistory()}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
        >
          clear
        </button>
      </div>
      <ul className="space-y-0.5">
        {searchHistory.map((search: ISearchHistoryEntry) => (
          <li key={search.publicId}>
            <Link
              to={`/deck/${search.publicId}`}
              className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm truncate">{search.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {search.publicUrl}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
