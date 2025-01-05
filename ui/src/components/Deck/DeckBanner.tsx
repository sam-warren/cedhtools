import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link, Skeleton } from '@mui/joy';
import { IMoxfieldDeck } from 'src/types';
import DeckFilters from './DeckFilters';

interface DeckBannerProps {
  deck?: IMoxfieldDeck;
  isLoading?: boolean;
}

const DeckBanner: React.FC<DeckBannerProps> = ({ deck, isLoading = false }) => {
  const styles = {
    banner: {
      width: '100%',
      bgcolor: 'background.level1',
      borderBottom: '1px solid',
      borderColor: 'divider',
      px: 3,
      py: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      height: '88px',
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
    },
    authorLink: {
      color: 'inherit',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  };

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
              sx={styles.authorLink}
            >
              {author.displayName}
            </Link>
          </span>
        ))}
      </>
    );
  };

  return (
    <Box sx={styles.banner}>
      {isLoading ? (
        <>
          <Box sx={styles.titleContainer}>
            <Skeleton variant="text" width="200px" />
            <Skeleton variant="text" width="150px" level="body-sm" />
          </Box>
        </>
      ) : (
        <>
          <Box sx={styles.titleContainer}>
            <Typography level="h3" sx={{ flexShrink: 0 }}>
              <Link
                href={deck?.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={styles.authorLink}
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