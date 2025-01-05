import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link, Skeleton } from '@mui/joy';
import { IMoxfieldDeck } from 'src/types';
import DeckFilters from './DeckFilters';
import { bannerStyles } from 'src/styles';

interface DeckBannerProps {
  deck?: IMoxfieldDeck;
  isLoading?: boolean;
}

const DeckBanner: React.FC<DeckBannerProps> = ({ deck, isLoading = false }) => {

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

  return (
    <Box sx={bannerStyles.container}>
      {isLoading ? (
        <Box sx={bannerStyles.titleContainer}>
          <Skeleton variant="text" width="200px" />
          <Skeleton variant="text" width="150px" level="body-sm" />
        </Box>
      ) : (
        <>
          <Box sx={bannerStyles.titleContainer}>
            <Typography level="title-lg" sx={{ flexShrink: 0 }}>
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
          </Box>
          <DeckFilters />
        </>
      )}
    </Box>
  );
};

export default DeckBanner;
