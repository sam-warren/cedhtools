import React from 'react';
import { Box, useTheme } from '@mui/joy';
import { ICommanderDetail } from 'src/types';
import { cardStyles } from 'src/styles';
import { useImageCache } from 'src/hooks/useImageCache';
import ImageWithLoading from './ImageWithLoading';

interface CommanderCardProps {
  card: ICommanderDetail;
}

const CommanderCard: React.FC<CommanderCardProps> = ({ card }) => {
  const { src: cachedSrc } = useImageCache(
    card.scryfall_id,
    card.image_uris.normal,
    true
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