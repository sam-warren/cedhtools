import React, { useEffect, useState } from 'react';
import BalanceIcon from '@mui/icons-material/Balance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Box } from '@mui/joy';
import { useAppSelector } from 'src/hooks';
import StatCounter from '../Feedback/StatCounter';
import CommanderStack from './CommanderStack';
import { useMemo } from 'react';
import { ICommanderDetail } from 'src/types';

function StatsSkeletonSection() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
      <StatCounter.Skeleton />
      <StatCounter.Skeleton />
      <StatCounter.Skeleton />
    </Box>
  );
}

function CommanderDetails(): JSX.Element {
  const isStatsLoading = useAppSelector((state) => state.deck.isStatsLoading);
  const deckStats = useAppSelector((state) => state.deck.deckStats);

  // Track initial commander load
  const [hasLoadedCommanders, setHasLoadedCommanders] = useState(false);
  
  // Track both mount and visibility states
  const [isMounted, setIsMounted] = useState({ skeleton: true, content: true });
  const [opacity, setOpacity] = useState({ skeleton: 1, content: 0 });

  useEffect(() => {
    if (deckStats?.commanders && !hasLoadedCommanders) {
      setHasLoadedCommanders(true);
    }
  }, [deckStats?.commanders]);

  // Handle stats loading state changes
  useEffect(() => {
    if (isStatsLoading) {
      // First show skeleton
      setIsMounted({ skeleton: true, content: true });
      setOpacity({ skeleton: 1, content: 0 });
    } else if (deckStats) {
      // Then transition to content
      setOpacity({ skeleton: 0, content: 1 });
      // Only unmount skeleton after transition
      setTimeout(() => {
        setIsMounted(prev => ({ ...prev, skeleton: false }));
      }, 0);
    }
  }, [isStatsLoading, deckStats]);

  const memoizedCommanders = useMemo(
    () => (deckStats?.commanders ?? []) as ICommanderDetail[],
    [deckStats?.commanders],
  );

  const win_rate = deckStats?.meta_statistics?.baseline_performance?.win_rate ?? 0;
  const draw_rate = deckStats?.meta_statistics?.baseline_performance?.draw_rate ?? 0;
  const total_decks = deckStats?.meta_statistics?.sample_size?.total_decks ?? 0;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <CommanderStack 
        commanders={memoizedCommanders} 
        isInitialLoad={!hasLoadedCommanders}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
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