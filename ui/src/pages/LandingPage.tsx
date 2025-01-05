import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Search from 'src/components/Search/Search';
import SearchHistory from 'src/components/Search/SearchHistory';

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
        pt: 16,
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
          equipped with powerful statistics to improve your cEDH decks
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
          pb: 2,
        }}
      >
        <SearchHistory />
      </Box>
    </Box>
  );
}
