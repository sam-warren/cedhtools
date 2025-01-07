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
  const error = useAppSelector((state) => state.deck.error);

  // Track initial commander load
  const [hasLoadedCommanders, setHasLoadedCommanders] = useState(false);
  
  // Track stats visibility state
  const [showStatsSkeleton, setShowStatsSkeleton] = useState(true);

  useEffect(() => {
    if (deckStats?.commanders && !hasLoadedCommanders) {
      setHasLoadedCommanders(true);
    }
  }, [deckStats?.commanders]);

  // Handle stats loading state changes with shorter delay
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isStatsLoading) {
      setShowStatsSkeleton(true);
    } else if (deckStats) {
      // Reduced delay for snappier transitions
      timeout = setTimeout(() => {
        setShowStatsSkeleton(false);
      }, 0);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isStatsLoading, deckStats]);

  const memoizedCommanders = useMemo(
    () => (deckStats?.commanders ?? []) as ICommanderDetail[],
    [deckStats?.commanders],
  );

  const win_rate = deckStats?.meta_statistics?.baseline_performance?.win_rate ?? 0;
  const draw_rate = deckStats?.meta_statistics?.baseline_performance?.draw_rate ?? 0;
  const total_decks = deckStats?.meta_statistics?.sample_size?.total_decks ?? 0;

  const transitionStyles = {
    opacity: 1,
    transition: 'opacity 150ms ease-out',
    transform: 'translateZ(0)', // Force GPU acceleration for smoother transitions
    willChange: 'opacity', // Hint to browser about upcoming changes
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <CommanderStack 
        commanders={memoizedCommanders} 
        isInitialLoad={!hasLoadedCommanders}
      />
      
      {/* Stats section */}
      {showStatsSkeleton ? (
        <Box sx={transitionStyles}>
          <StatsSkeletonSection />
        </Box>
      ) : (
        <Box sx={transitionStyles}>
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
  );
}

export default CommanderDetails;