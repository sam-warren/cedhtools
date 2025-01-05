import { Box, Skeleton } from '@mui/joy';
import {
  deckPageLayout,
  gridLayouts,
  skeletonStyles,
  skeletonSections,
  bannerStyles,
} from 'src/styles';

interface CardSkeletonProps {
  showTextbox?: boolean;
}

const CardSkeleton = ({ showTextbox = false }: CardSkeletonProps) => (
  <Box sx={skeletonStyles.card}>
    <Skeleton variant="rectangular" sx={skeletonStyles.cardImage} />
    {showTextbox && (
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
        <Skeleton variant="text" width="80%" />
      </Box>
    )}
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
      <Box sx={skeletonStyles.banner}>
        <Skeleton variant="rectangular" width={160} height={32} />
        <Skeleton variant="rectangular" width={160} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </Box>
    </Box>

    <Box sx={deckPageLayout.contentWrapper}>
      <Box sx={deckPageLayout.wrapper}>
        {/* Left Pane */}
        <Box sx={deckPageLayout.leftPane}>
          <Skeleton
            variant="text"
            sx={{ mb: 2, width: '100%', textAlign: 'center' }}
          />
          <Box sx={{ mb: 3 }}>
            <CardSkeleton showTextbox={false} />
          </Box>
          <Skeleton variant="text" level="h4" sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={140}
                height={32}
                sx={{ borderRadius: 'sm' }}
              />
            ))}
          </Box>
        </Box>

        {/* Right Pane */}
        <Box sx={deckPageLayout.rightPane}>
          {skeletonSections.map((section) => (
            <Box key={section.type} sx={skeletonStyles.section}>
              <Skeleton variant="text" width={200} level="h2" sx={{ mb: 2 }} />
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
