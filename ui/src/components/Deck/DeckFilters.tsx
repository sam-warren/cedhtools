import React, { useState } from 'react';
import { Box, FormControl, Select, Option, Button, FormLabel } from '@mui/joy';
import { filterStyles } from 'src/styles';

const TIME_PERIOD_OPTIONS = [
  { value: '1m', label: '1 month'},
  { value: '3m', label: '3 months'},
  { value: '6m', label: '6 months'},
  { value: '1y', label: '1 year'},
  { value: 'ban', label: 'post ban'},
  { value: 'all', label: 'all time'},
];

const TOURNAMENT_SIZE_OPTIONS = [
  { value: 30, label: '30+ players' },
  { value: 60, label: '60+ players' },
  { value: 100, label: '100+ players' },
  { value: 0, label: 'all tournaments' },
];

interface FilterState {
  timePeriod: string;
  minSize: number;
}

const DeckFilters: React.FC = () => {
  const [formState, setFormState] = useState<FilterState>({
    timePeriod: 'ban', // Set default values to fix controlled component error
    minSize: 0,
  });

  const handleApplyFilters = () => {
    console.log('Applying filters:', formState);
  };

  return (
    <Box sx={filterStyles.container}>
      <Box sx={filterStyles.filterGroup}>
        <FormControl size="sm" sx={filterStyles.formControl}>
          <FormLabel>time period</FormLabel>
          <Select 
            value={formState.timePeriod}
            onChange={(_, value) => 
              setFormState(prev => ({ 
                ...prev, 
                timePeriod: value || '1m' // Provide fallback value 
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
              setFormState(prev => ({ 
                ...prev, 
                minSize: value ?? 0 // Provide fallback value
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
          >
            apply
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DeckFilters;