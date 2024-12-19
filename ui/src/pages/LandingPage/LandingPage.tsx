import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Search from '../../components/Search/Search';
import SearchHistory from '../../components/SearchHistory/SearchHistory';

export default function LandingPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        px: 2,
        pt: 'calc(100vh * 0.15)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Typography
          level="title-lg"
          sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}
        >
          welcome to cedhtools
        </Typography>
        <Typography level="body-md" color="neutral">
          equipped with powerful statistics to improve your deckbuilding
        </Typography>
        <Search />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          px: 2,
          pb: 'calc(100vh * 0.02)',
        }}
      >
        <SearchHistory />
      </Box>
    </Box>
  );
}
