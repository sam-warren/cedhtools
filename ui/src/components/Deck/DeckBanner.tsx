import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { Link, Skeleton } from '@mui/joy';
import DeckFilters from './DeckFilters';
import { bannerStyles } from 'src/styles';
import { useAppSelector } from 'src/hooks';
import TransitionWrapper from '../Feedback/TransitionWrapper';
import { useParams } from 'react-router-dom';

const DeckBannerSkeleton = () => (
  <Box
    sx={{
      ...bannerStyles.titleContainer,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Typography
      level="title-lg"
      sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
    >
      <Skeleton variant="text" level="title-lg" width="500px" />
    </Typography>
    <Typography
      level="body-sm"
      color="neutral"
      sx={{ display: 'flex', alignItems: 'center' }}
    >
      <Skeleton variant="text" level="body-sm" width="250px" />
    </Typography>
  </Box>
);

const AuthorsList = ({
  authors,
}: {
  authors?: Array<{ userName: string; displayName: string }>;
}) => {
  if (!authors?.length) return null;

  return (
    <>
      created by{' '}
      {authors.map((author, index) => (
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

const DeckContent = ({ deck }: { deck: any }) => (
  <Box
    sx={{
      ...bannerStyles.titleContainer,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Typography level="title-lg" sx={{ flexShrink: 0 }}>
      <Link
        href={deck?.publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={bannerStyles.authorLink}
      >
        {deck?.name || ''}
      </Link>
    </Typography>
    <Typography level="body-sm" color="neutral">
      <AuthorsList authors={deck?.authors} />
    </Typography>
  </Box>
);

function DeckBanner() {
  const { deckId } = useParams<{ deckId?: string }>(); // Extract deckId from URL
  const { deck, isDeckLoading } = useAppSelector((state) => state.deck);
  const isLoading = isDeckLoading || !deck;

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
        <TransitionWrapper
          key={deckId} // Add deckId as key to force remount on deck change
          loading={isLoading}
          skeleton={<DeckBannerSkeleton />}
          
          sx={{
            height: '4rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <DeckContent deck={deck} />
        </TransitionWrapper>

        <DeckFilters deckId={deck?.publicId || ''} />
      </Box>
    </Box>
  );
}

export default DeckBanner;
