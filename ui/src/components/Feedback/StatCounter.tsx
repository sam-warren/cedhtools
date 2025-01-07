import { Box, Skeleton, Typography } from '@mui/joy';
import CountUp from 'react-countup';
import { useRef, useState, useEffect } from 'react';

interface StatCounterProps {
  value?: number;
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
        width: 252,
        height: 73,
        opacity: 1,
        transition: 'opacity 300ms ease-in-out',
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
  value = 0,
  label,
  icon,
  type = 'percentage',
  duration = 2,
  isLoading = false,
  formatOptions = {},
}: StatCounterProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

  if (isLoading) {
    return <StatCounterSkeleton />;
  }

  const displayValue = type === 'percentage' ? (value || 0) * 100 : value || 0;
  const defaultFormatOptions =
    type === 'percentage'
      ? { decimals: 2, suffix: '%' }
      : { decimals: 0, separator: ',' };
  const finalFormatOptions = { ...defaultFormatOptions, ...formatOptions };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 'md',
        bgcolor: 'background.level1',
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
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
        <Typography level="body-sm" sx={{ mb: -0.5 }}>
          {label}
        </Typography>
        <Typography level="h3" sx={{ fontSize: '1.5rem' }}>
          {isMounted && (
            <CountUp
              start={0}
              delay={1}
              end={displayValue}
              duration={duration}
              decimals={finalFormatOptions.decimals}
              separator={finalFormatOptions.separator}
              prefix={finalFormatOptions.prefix}
              suffix={finalFormatOptions.suffix}
            />
          )}
        </Typography>
      </Box>
    </Box>
  );
}

StatCounter.Skeleton = StatCounterSkeleton;
