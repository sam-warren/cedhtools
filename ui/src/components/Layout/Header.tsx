import { Typography } from '@mui/joy';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import { useNavigate } from 'react-router-dom';
import ColorSchemeToggle from 'src/components/ColorSchemeToggle/ColorSchemeToggle'; // Export * does not re-export a default

export default function Header() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          paddingLeft: 4,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          display: { xs: 'none', sm: 'flex' },
        }}
      >
        <Typography level="h3">cedhtools</Typography>
        <Button
          variant="plain"
          color="neutral"
          size="lg"
          onClick={() => navigate('/')}
          sx={{ alignSelf: 'center' }}
        >
          search
        </Button>
      </Stack>
      <ColorSchemeToggle />
    </Box>
  );
}
