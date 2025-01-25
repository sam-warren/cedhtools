import React from 'react';
import { ICommanderDetail } from 'src/types';
import { cardStyles } from 'src/styles';
import { useImageCache } from 'src/hooks/useImageCache';
import ImageWithLoading from './ImageWithLoading';
import { useInView } from 'react-intersection-observer';

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

const CommanderCard = ({ card }: CommanderCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  const { getImageUrl } = useImageCache();
  const imageUrl = getImageUrl(card.unique_card_id);

  return (
    <div 
      ref={ref}
      className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden bg-transparent"
    >
      {inView && (
        <ImageWithLoading
          src={imageUrl}
          alt={card.name}
          className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
        />
      )}
    </div>
  );
};

CommanderCard.Skeleton = function CommanderCardSkeleton() {
  return (
    <div className="relative w-full aspect-[2.5/3.5] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse" />
  );
};

// Explicitly assign `Skeleton` to the memoized component
const CommanderCardComponent = CommanderCard as CommanderCardComponent;
CommanderCardComponent.Skeleton = CommanderCardSkeleton;

export default CommanderCardComponent;
