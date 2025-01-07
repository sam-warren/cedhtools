import { Box, Skeleton, Typography } from '@mui/joy';
import { keyframes } from '@emotion/react';
import { useCountUp } from 'react-countup';
import { useRef } from 'react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

interface StatCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  type?: 'percentage' | 'integer';
  variant?: 'winRate' | 'drawRate' | 'sampleSize' | 'default';
  duration?: number;
  isLoading?: boolean;
  formatOptions?: {
    decimals?: number;
    separator?: string;
    prefix?: string;
    suffix?: string;
  };
}

function StatCounterSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 'md',
        bgcolor: 'background.level1',
      }}
    >
      <Skeleton variant="circular" width={20} height={20} />
      <Box>
        <Skeleton variant="text" width={80} height={16} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={60} height={24} />
      </Box>
    </Box>
  );
}

export default function StatCounter({
  value,
  label,
  icon,
  type = 'percentage',
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

  useCountUp({
    ref: countUpRef,
    start: 0,
    end: displayValue,
    duration,
    ...finalFormatOptions,
    delay: 0.5,
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 'md',
        bgcolor: 'background.level1',
        animation: `${fadeIn} 0.5s ease-in`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          '& > svg': {
            fontSize: '1.25rem',
          },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          level="body-sm"
          sx={{
            mb: -0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          level="h3"
          sx={{
            fontSize: '1.5rem',
          }}
        >
          <span ref={countUpRef} />
        </Typography>
      </Box>
    </Box>
  );
}

StatCounter.Skeleton = StatCounterSkeleton;