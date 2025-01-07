import React from 'react';
import { Box, Skeleton, useTheme } from '@mui/joy';
import { ICommanderDetail } from 'src/types';
import { cardStyles } from 'src/styles';
import { useImageCache } from 'src/hooks/useImageCache';
import ImageWithLoading from './ImageWithLoading';

type CommanderCardComponent = React.FC<CommanderCardProps> & {
  Skeleton: typeof CommanderCardSkeleton;
};

function CommanderCardSkeleton() {
  const theme = useTheme();
  return (
    <Box sx={cardStyles.cardContainer('commander')}>
      <Box sx={cardStyles.wrapper}>
        <Box sx={cardStyles.imageContainer(theme, 'commander')}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              zIndex: 2,
            }}
          >
            <Skeleton
              variant="rectangular"
              animation="pulse"
              width="100%"
              height="100%"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

interface CommanderCardProps {
  card: ICommanderDetail;
}

const MemoizedCommanderCard: React.FC<CommanderCardProps> = React.memo(
  ({ card }) => {
    const { src: cachedSrc } = useImageCache(
      card.scryfall_id,
      card.image_uris.normal,
      true,
    );

    const theme = useTheme();

    return (
      <Box sx={cardStyles.cardContainer('commander')}>
        <Box sx={cardStyles.wrapper}>
          <Box sx={cardStyles.imageContainer(theme, 'commander')}>
            <ImageWithLoading
              src={cachedSrc}
              alt={card.name}
              sx={cardStyles.image('commander')}
            />
          </Box>
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) =>
    prevProps.card.unique_card_id === nextProps.card.unique_card_id &&
    prevProps.card.image_uris.normal === nextProps.card.image_uris.normal,
);

// Explicitly assign `Skeleton` to the memoized component
const CommanderCard = MemoizedCommanderCard as CommanderCardComponent;
CommanderCard.Skeleton = CommanderCardSkeleton;

export default CommanderCard;
