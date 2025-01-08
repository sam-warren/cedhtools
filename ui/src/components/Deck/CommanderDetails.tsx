import React, { useEffect, useState, useMemo } from 'react';
import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';
import { ICommanderDetail } from 'src/types';

function StatsSkeletonSection() {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}
    >
      <StatCounter.Skeleton />
      <StatCounter.Skeleton />
      <StatCounter.Skeleton />
    </Box>
  );
}

function CommanderDetails(): JSX.Element {
  const isStatsLoading = useAppSelector((state) => state.deck.isStatsLoading);
  const deckStats = useAppSelector((state) => state.deck.deckStats);

  const [isMounted, setIsMounted] = useState({
    skeleton: true,
    content: false,
  });
  const [opacity, setOpacity] = useState({ skeleton: 1, content: 0 });

  // Track if we've shown content at least once
  const [hasShownContent, setHasShownContent] = useState(false);

  // Handle stats loading state changes
  useEffect(() => {
    if (!hasShownContent && deckStats) {
      // First time showing content
      setHasShownContent(true);
      setIsMounted({ skeleton: true, content: true });

      // Brief delay to ensure content is mounted
      setTimeout(() => {
        setOpacity({ skeleton: 0, content: 1 });

        // Unmount skeleton after transition
        setTimeout(() => {
          setIsMounted((prev) => ({ ...prev, skeleton: false }));
        }, 150);
      }, 50);
    } else if (isStatsLoading) {
      // Subsequent loading states - don't remount skeleton if we've shown content
      if (!hasShownContent) {
        setIsMounted({ skeleton: true, content: false });
        setOpacity({ skeleton: 1, content: 0 });
      }
    }
  }, [isStatsLoading, deckStats, hasShownContent]);

  const memoizedCommanders = useMemo(
    () => (deckStats?.commanders ?? []) as ICommanderDetail[],
    [deckStats?.commanders],
  );

  const win_rate = deckStats?.meta_statistics?.baseline_performance?.win_rate;
  const draw_rate = deckStats?.meta_statistics?.baseline_performance?.draw_rate;
  const total_decks = deckStats?.meta_statistics?.sample_size?.total_decks;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <CommanderStack
        commanders={memoizedCommanders}
        isInitialLoad={isStatsLoading || !deckStats}
      />

      {/* Stats section */}
      <Box sx={{ position: 'relative' }}>
        {/* Skeleton layer */}
        {isMounted.skeleton && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              opacity: opacity.skeleton,
              transition: 'opacity 150ms ease-out',
            }}
          >
            <StatsSkeletonSection />
          </Box>
        )}

        {/* Content layer */}
        {isMounted.content && (
          <Box
            sx={{
              opacity: opacity.content,
              transition: 'opacity 150ms ease-out',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                width: '100%',
              }}
            >
              <StatCounter
                value={win_rate}
                label="average win rate"
                icon={<EmojiEventsIcon />}
                variant="winRate"
                type="percentage"
              />
              <StatCounter
                value={draw_rate}
                label="average draw rate"
                icon={<BalanceIcon />}
                variant="drawRate"
                type="percentage"
              />
              <StatCounter
                value={total_decks}
                label="sample size"
                icon={<Inventory2Icon />}
                type="integer"
                variant="sampleSize"
                formatOptions={{
                  separator: ',',
                  suffix: ' decks',
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default CommanderDetails;
