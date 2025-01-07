import React, { useState } from 'react';
import { Box, FormControl, Select, Option, Button, FormLabel } from '@mui/joy';
import { filterStyles } from 'src/styles';
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

const DeckFilters: React.FC<{ deckId: string }> = ({ deckId }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const dispatch = useAppDispatch();
  const filterSettings = useAppSelector((state) => state.deck.filterSettings);

  const handleApplyFilters = () => {
    setIsAnimating(true);
    dispatch(
      fetchDeckStats({
        deckId,
        timePeriod: filterSettings.timePeriod,
        minSize: filterSettings.minSize,
      }),
    ).finally(() => {
      setIsAnimating(false);
    });
  };
  const handleFilterChange = (newSettings: Partial<FilterSettings>) => {
    dispatch(updateFilterSettings(newSettings));
  };

  return (
    <Box sx={filterStyles.container}>
      <Box sx={filterStyles.filterGroup}>
        <FormControl size="sm" sx={filterStyles.formControl}>
          <FormLabel>time period</FormLabel>
          <Select
            value={filterSettings.timePeriod}
            onChange={(_, value) =>
              handleFilterChange({ timePeriod: value || 'ban' })
            }
            size="sm"
          >
            {TIME_PERIOD_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FormControl>

        <FormControl size="sm" sx={filterStyles.formControl}>
          <FormLabel>tournament size</FormLabel>
          <Select
            value={filterSettings.minSize}
            onChange={(_, value) =>
              handleFilterChange({ minSize: value ?? 60 })
            }
            size="sm"
          >
            {TOURNAMENT_SIZE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button
            onClick={handleApplyFilters}
            size="sm"
            variant="soft"
            loading={isAnimating} // Use combined state
          >
            apply
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DeckFilters;
