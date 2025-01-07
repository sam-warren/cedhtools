import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link } from '@mui/joy';
import DeckFilters from './DeckFilters';
import { bannerStyles } from 'src/styles';
import { useAppSelector } from 'src/hooks';

function DeckBanner() {
  const { deck } = useAppSelector((state) => state.deck);

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
                ...(deck
                  ? {
                      animation: 'fadeInContent 0.3s ease-out forwards',
                      display: 'inline',
                    }
                  : {}),
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
            <Box
              sx={{
                animation: 'fadeInContent 0.3s ease-out forwards',
                opacity: 0,
                display: 'inline-block',
              }}
            >
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

      {/* Global Fade-in Animation */}
      <style>{`
        @keyframes fadeInContent {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}

export default DeckBanner;
