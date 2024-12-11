import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Search from '../../components/Search/Search';

export default function LandingPage() {
  return (
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
        pt: 'calc(100vh * 0.15)',
      }}
    >
      <Typography level="h1" sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
        welcome to cedhtools
      </Typography>
      <Typography level="body-md" color="neutral">
        a suite of tools to help players analyze and improve their CEDH decks
      </Typography>
      <Search />
    </Box>
  );
}
