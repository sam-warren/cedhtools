import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ISearchHistoryContext, ISearchHistoryEntry } from '../types';

const SearchHistoryContext = createContext<ISearchHistoryContext | undefined>(
  undefined,
);

export const SearchHistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchHistory, setSearchHistory] = useState<ISearchHistoryEntry[]>(
    () => {
      try {
        const storedSearchHistory = localStorage.getItem('searchHistory');
        if (storedSearchHistory) {
          const parsedSearchHistory: ISearchHistoryEntry[] =
            JSON.parse(storedSearchHistory);
          return parsedSearchHistory;
        }
      } catch (error) {
        console.error(
          'Failed to parse search history from localStorage:',
          error,
        );
      }
      return [];
    },
  );

  useEffect(() => {
    try {
      const stringifiedSearchHistory = JSON.stringify(searchHistory);
      localStorage.setItem('searchHistory', stringifiedSearchHistory);
    } catch (error) {
      console.error('Failed to save search history to localStorage:', error);
    }
  }, [searchHistory]);

  const addSearch = (search: ISearchHistoryEntry) => {
    setSearchHistory((prevSearches) => {
      const filteredSearches = prevSearches.filter(
        (d) => d.publicId !== search.publicId,
      );
      const updatedSearches = [search, ...filteredSearches];
      return updatedSearches.slice(0, 3);
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  return (
    <SearchHistoryContext.Provider
      value={{ searchHistory, addSearch, clearSearchHistory }}
    >
      {children}
    </SearchHistoryContext.Provider>
  );
};

export const useSearchHistory = (): ISearchHistoryContext => {
  const context = useContext(SearchHistoryContext);
  if (!context) {
    throw new Error(
      'useSearchHistory must be used within a SearchHistoryProvider',
    );
  }
  return context;
};
