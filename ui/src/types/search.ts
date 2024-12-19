export interface ISearchHistoryEntry {
  publicUrl: string;
  name: string;
  publicId: string;
}

export interface ISearchHistoryContext {
  searchHistory: ISearchHistoryEntry[];
  addSearch: (search: ISearchHistoryEntry) => void;
  clearSearchHistory: () => void;
}
