// src/components/DeckBanner.tsx
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link, Skeleton } from '@mui/joy';

import DeckFilters from './DeckFilters';
import { bannerStyles } from 'src/styles';
import { useAppSelector } from 'src/hooks';
import LoadingWrapper from '../Feedback/LoadingWrapper';

const DeckBannerSkeleton = () => {
  return (
    <Box sx={bannerStyles.titleContainer}>
      <Skeleton variant="text" level="title-lg" width="200px"/>
      <Skeleton variant="text" level="body-sm" width="150px"/>
    </Box>
  );
};

function DeckBanner() {
  const { deck, isDeckLoading } = useAppSelector((state) => state.deck);

  const renderAuthors = () => {
    if (!deck?.authors) return null;

    return (
      <>
        created by{' '}
        {deck.authors.map((author, index) => (
          <span key={author.userName}>
            {index > 0 && ', '}
            <Link
              href={`https://www.moxfield.com/users/${author.userName}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                ...bannerStyles.authorLink,
              }}
            >
              {author.displayName}
            </Link>
          </span>
        ))}
      </>
    );
  };

  return (
    <Box sx={bannerStyles.container}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={bannerStyles.titleContainer}>
          <LoadingWrapper
            loading={isDeckLoading}
            skeleton={<DeckBannerSkeleton />}
            staticRender={false}
          >
            <Typography level="title-lg" sx={{ flexShrink: 0 }}>
              Deck:{' '}
              <Link
                href={deck?.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={bannerStyles.authorLink}
              >
                {deck?.name}
              </Link>
            </Typography>
            <Typography level="body-sm" color="neutral">
              {renderAuthors()}
            </Typography>
          </LoadingWrapper>
        </Box>
        <DeckFilters deckId={deck ? deck.publicId : ''} />
      </Box>
    </Box>
  );
}

export default DeckBanner;
