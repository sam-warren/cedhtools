import React from 'react';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import {
  fetchDeckStats,
  updateFilterSettings,
} from 'src/store/slices/deckSlice';
import {
  TIME_PERIOD_OPTIONS,
  TOURNAMENT_SIZE_OPTIONS,
} from 'src/constants/deckFilterOptions';
import { FilterSettings } from 'src/types/store/rootState';

export default function DeckFilters() {
  const dispatch = useAppDispatch();
  const { filterSettings } = useAppSelector((state) => state.deck);

  const handleFilterChange = (key: keyof FilterSettings, value: string | number) => {
    dispatch(updateFilterSettings({ [key]: value }));
    dispatch(fetchDeckStats());
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-4">
        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Period
          </label>
          <select
            value={filterSettings.timePeriod}
            onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {TIME_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tournament Size
          </label>
          <select
            value={filterSettings.minSize}
            onChange={(e) => handleFilterChange('minSize', Number(e.target.value))}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {TOURNAMENT_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
