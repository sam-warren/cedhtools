import { Box, Skeleton, useTheme } from '@mui/joy';
import {
  deckPageLayout,
  gridLayouts,
  skeletonStyles,
  skeletonSections,
  bannerStyles,
  cardStyles,
  cardConstants,
} from 'src/styles';

interface CardSkeletonProps {
  showTextbox?: boolean;
}

const CardSkeleton = ({ showTextbox = false }: CardSkeletonProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...cardStyles.container,
        mt: showTextbox ? `${cardConstants.STATS_BANNER_HEIGHT}px` : 0,
      }}
    >
      <Box sx={cardStyles.wrapper}>
        <Box sx={cardStyles.imageContainer(theme, 'deck')}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={cardStyles.image}
          />
        </Box>
      </Box>

      {showTextbox && (
        <Box sx={cardStyles.titleContainer}>
          <Skeleton variant="text" width="80%" />
        </Box>
      )}
    </Box>
  );
};

const StatCounterSkeleton = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1.5,
      borderRadius: 'md',
      bgcolor: 'background.level1',
    }}
  >
    <Skeleton variant="circular" width={20} height={20} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" level="body-sm" />
      <Skeleton variant="text" width="40%" level="h3" />
    </Box>
  </Box>
);

const DeckSkeleton = () => (
  <Box sx={deckPageLayout.pageContainer}>
    {/* Banner Skeleton */}
    <Box sx={bannerStyles.container}>
      <Box sx={bannerStyles.titleContainer}>
        <Skeleton variant="text" width={300} level="h3" />
        <Skeleton variant="text" width={200} level="body-sm" />
      </Box>
    </Box>
    <Box sx={deckPageLayout.contentWrapper}>
      <Box sx={deckPageLayout.wrapper}>
        {/* Left Pane */}
        <Box sx={deckPageLayout.leftPane}>
          <Box sx={{ mb: 0 }}>
            <CardSkeleton showTextbox={false} />
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mt: 2,
            }}
          >
            {/* Three stat counter skeletons */}
            <StatCounterSkeleton />
            <StatCounterSkeleton />
            <StatCounterSkeleton />
          </Box>
        </Box>

        {/* Right Pane */}
        <Box sx={deckPageLayout.rightPane}>
          {skeletonSections.map((section) => (
            <Box key={section.type} sx={skeletonStyles.section}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Skeleton variant="text" width={200} level="h2" />
                <Skeleton
                  variant="rectangular"
                  width={80}
                  height={32}
                  sx={{ borderRadius: 'md' }}
                />
              </Box>
              <Box sx={gridLayouts.cardGrid}>
                {Array.from({ length: section.count }).map((_, index) => (
                  <CardSkeleton key={`${section.type}-${index}`} showTextbox />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);

export default DeckSkeleton;
