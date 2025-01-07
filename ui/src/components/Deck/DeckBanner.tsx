import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link } from '@mui/joy';

import DeckFilters from './DeckFilters';
import { bannerStyles } from 'src/styles';
import { useAppSelector } from 'src/hooks';
import { useFadeAnimation } from '../../hooks/useFadeAnimation'; // Adjust import path as needed

function DeckBanner() {
  const { deck, isDeckLoading, error } = useAppSelector((state) => state.deck);

  // Use the improved fade animation hook
  const { fadeInStyle } = useFadeAnimation({
    data: deck,
    isLoading: isDeckLoading,
    error,
  });

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
                ...fadeInStyle,
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
    <Box
      sx={{
        ...bannerStyles.container,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={bannerStyles.titleContainer}>
          {deck ? (
            <Box sx={fadeInStyle}>
              <Typography level="title-lg" sx={{ flexShrink: 0 }}>
                Deck:{' '}
                <Link
                  href={deck.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={bannerStyles.authorLink}
                >
                  {deck.name}
                </Link>
              </Typography>
              <Typography level="body-sm" color="neutral">
                {renderAuthors()}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{ height: '100%', display: 'flex', alignItems: 'center' }}
            />
          )}
        </Box>
        <DeckFilters deckId={deck ? deck.publicId : ''} />
      </Box>
    </Box>
  );
}

export default DeckBanner;
