// src/components/Stats/StatCounter.tsx
import { Box, Typography, ColorPaletteProp } from '@mui/joy';
import { keyframes } from '@emotion/react';
import { useCountUp } from 'react-countup';
import { useRef } from 'react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

type ColorVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface StatCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  type?: 'percentage' | 'integer';
  variant?: 'winRate' | 'drawRate' | 'sampleSize' | 'default';
  thresholds?: {
    value: number;
    color: ColorVariant;
  }[];
  duration?: number;
  formatOptions?: {
    decimals?: number;
    separator?: string;
    prefix?: string;
    suffix?: string;
  };
}

export default function StatCounter({
  value,
  label,
  icon,
  type = 'percentage',
  variant = 'default',
  thresholds = [],
  duration = 2,
  formatOptions = {},
}: StatCounterProps) {
  const countUpRef = useRef(null);

  const displayValue = type === 'percentage' ? value * 100 : value;

  const defaultFormatOptions =
    type === 'percentage'
      ? { decimals: 2, suffix: '%' }
      : { decimals: 0, separator: ',' };

  const finalFormatOptions = { ...defaultFormatOptions, ...formatOptions };

  const variantThresholds = {
    winRate: [
      { value: 20, color: 'success' as const },
      { value: 15, color: 'warning' as const },
      { value: 0, color: 'danger' as const },
    ],
    drawRate: [{ value: 0, color: 'neutral' as const }],
    sampleSize: [
      { value: 1000, color: 'success' as const },
      { value: 500, color: 'warning' as const },
      { value: 0, color: 'neutral' as const },
    ],
    default: [{ value: 0, color: 'neutral' as const }],
  };

  const activeThresholds =
    thresholds.length > 0 ? thresholds : variantThresholds[variant];

  const getColor = (currentValue: number): ColorPaletteProp => {
    const threshold = activeThresholds
      .sort((a, b) => b.value - a.value)
      .find((t) => currentValue >= t.value);

    return threshold?.color || 'neutral';
  };

  useCountUp({
    ref: countUpRef,
    start: 0,
    end: displayValue,
    duration,
    ...finalFormatOptions,
    delay: 1.5,
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,  // Reduced from 2
        borderRadius: 'md',
        bgcolor: 'background.level1',
        animation: `${fadeIn} 0.5s ease-in`,
      }}
    >
      <Box sx={{ 
        color: (theme) => theme.vars.palette[getColor(displayValue)][500],
        display: 'flex',
        alignItems: 'center',
        '& > svg': { // Make icons slightly smaller
          fontSize: '1.25rem'
        }
      }}>
        {icon}
      </Box>
      <Box>
        <Typography 
          level="body-sm" 
          sx={{ 
            mb: -0.5 // Reduce space between label and value
          }}
        >
          {label}
        </Typography>
        <Typography 
          level="h3" 
          sx={{ 
            color: (theme) => theme.vars.palette[getColor(displayValue)][500],
            fontSize: '1.5rem' // Make the numbers slightly smaller
          }}
        >
          <span ref={countUpRef} />
        </Typography>
      </Box>
    </Box>
  );
}
