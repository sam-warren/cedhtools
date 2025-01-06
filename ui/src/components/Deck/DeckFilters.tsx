import React, { useState } from 'react';
import { Box, FormControl, Select, Option, Button, FormLabel } from '@mui/joy';
import { filterStyles } from 'src/styles';
import { useAppDispatch } from 'src/hooks';
import { fetchDeckData } from 'src/store/slices/deckSlice';
import {
  TIME_PERIOD_OPTIONS,
  TOURNAMENT_SIZE_OPTIONS,
} from 'src/constants/deckFilterOptions';

interface FilterState {
  timePeriod: string;
  minSize: number;
}

const DeckFilters: React.FC<{ deckId: string }> = ({ deckId }) => {
  const [formState, setFormState] = useState<FilterState>({
    timePeriod: 'all',
    minSize: 0,
  });

  const dispatch = useAppDispatch();

  const handleApplyFilters = () => {
    console.log('Applying filters:', {
      timePeriod: formState.timePeriod,
      minSize: formState.minSize,
    });
    dispatch(
      fetchDeckData({
        deckId,
        timePeriod: formState.timePeriod,
        minSize: formState.minSize,
      }),
    )
      .unwrap()
      .then((result) => {
        console.log('Filter applied, new deckStats:', result.deckStats);
      });
  };

  return (
    <Box sx={filterStyles.container}>
      <Box sx={filterStyles.filterGroup}>
        <FormControl size="sm" sx={filterStyles.formControl}>
          <FormLabel>time period</FormLabel>
          <Select
            value={formState.timePeriod}
            onChange={(_, value) =>
              setFormState((prev) => ({
                ...prev,
                timePeriod: value || '1m',
              }))
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
            value={formState.minSize}
            onChange={(_, value) =>
              setFormState((prev) => ({
                ...prev,
                minSize: value ?? 0,
              }))
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
          <Button onClick={handleApplyFilters} size="sm" variant="soft">
            apply
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DeckFilters;
