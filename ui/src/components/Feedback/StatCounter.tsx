import { Box, Typography } from '@mui/joy';
import CountUp from 'react-countup';

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

export default function StatCounter({
  value = 0,
  label,
  icon,
  type = 'percentage',
  duration = 2,
  formatOptions = {},
}: StatCounterProps) {
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
          <CountUp
            start={0}
            delay={1}
            preserveValue={true}
            end={displayValue}
            duration={duration}
            decimals={finalFormatOptions.decimals}
            separator={finalFormatOptions.separator}
            prefix={finalFormatOptions.prefix}
            suffix={finalFormatOptions.suffix}
          />
        </Typography>
      </Box>
    </Box>
  );
}
