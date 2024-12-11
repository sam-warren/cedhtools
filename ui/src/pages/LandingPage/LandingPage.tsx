import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import Input from '@mui/joy/Input';
import SearchIcon from '@mui/icons-material/Search';

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
        gap: 2,
        px: 2,
        pt: 'calc(100vh * 0.2)',
      }}
    >
      <Typography level="h1" sx={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
        Welcome to cedhtools
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '70%',
        }}
      >
        <Input
          placeholder="Enter a Moxfield link to unlock powerful data"
          startDecorator={<SearchIcon />}
          endDecorator={<Button>Analyze</Button>}
          sx={{
            flexGrow: 1,
            bgcolor: 'background.level1',
            maxWidth: '600px',
            '--Input-radius': '10px',
          }}
        />
      </Box>
      <Typography level="body-md" color="neutral">
        cedhtools is a suite of tools to help players analyze and improve their
        CEDH decks.
      </Typography>
    </Box>
  );
}
