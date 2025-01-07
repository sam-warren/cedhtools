import React, { useState } from 'react';
import { Box, FormControl, Select, Option, Button, FormLabel } from '@mui/joy';
import { filterStyles } from 'src/styles';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { fetchDeckData, fetchDeckStats } from 'src/store/slices/deckSlice';
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
  const { isStatsLoading } = useAppSelector((state) => state.deck);
  const handleApplyFilters = () => {
    console.log('Applying filters:', {
      timePeriod: formState.timePeriod,
      minSize: formState.minSize,
    });
    dispatch(
      fetchDeckStats({
        deckId,
        timePeriod: formState.timePeriod,
        minSize: formState.minSize,
      }),
    )
      .unwrap()
      .then((result) => {
        console.log('Stats fetched:',
          result,
        );
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
          <Button
            onClick={handleApplyFilters}
            size="sm"
            variant="soft"
            loading={isStatsLoading}
          >
            apply
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DeckFilters;
