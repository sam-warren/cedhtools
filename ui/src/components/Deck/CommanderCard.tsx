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

const CommanderCard: CommanderCardComponent = ({ card }) => {
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
};

export default CommanderCard;
CommanderCard.Skeleton = CommanderCardSkeleton;
