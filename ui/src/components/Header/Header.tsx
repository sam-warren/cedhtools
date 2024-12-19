import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Button from '@mui/joy/Button';
import ColorSchemeToggle from '../ColorSchemeToggle/ColorSchemeToggle';

export default function Header() {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          display: { xs: 'none', sm: 'flex' },
        }}
      >
        <Button
          variant="plain"
          color="neutral"
          component="a"
          href="/"
          size="lg"
          sx={{ alignSelf: 'center' }}
        >
          Home
        </Button>
      </Stack>
      <ColorSchemeToggle />
    </Box>
  );
}
