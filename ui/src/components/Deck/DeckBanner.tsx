import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link, Skeleton } from '@mui/joy';
import DeckFilters from './DeckFilters';
import { bannerStyles } from 'src/styles';
import { useAppSelector } from 'src/hooks';

function DeckBannerSkeleton() {
  return (
    <Box sx={bannerStyles.container}>
      <Box sx={bannerStyles.titleContainer}>
        <Skeleton variant="text" width="200px" />
        <Skeleton variant="text" width="150px" level="body-sm" />
      </Box>
    </Box>
  );
}
function DeckBanner() {
  const deck = useAppSelector((state) => state.deck.deck);

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
              sx={bannerStyles.authorLink}
            >
              {author.displayName}
            </Link>
          </span>
        ))}
      </>
    );
  };

  if (!deck) {
    return null;
  }

  return (
    <Box sx={bannerStyles.container}>
      <Box sx={bannerStyles.titleContainer}>
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
      <DeckFilters deckId={deck.publicId} />
    </Box>
  );
}

DeckBanner.Skeleton = DeckBannerSkeleton;
export default DeckBanner;
