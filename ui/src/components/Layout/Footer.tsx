import Box from '@mui/joy/Box';
import Link from '@mui/joy/Link';
import Stack from '@mui/joy/Stack';

export default function Footer() {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
        }}
      >
        <span>
          Powerfully driven by data from{' '}
          <Link
            href="https://www.moxfield.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Moxfield
          </Link>{', '}
          <Link
            href="https://www.scryfall.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Scryfall
          </Link>{', '}
          and{' '}
          <Link
            href="https://www.topdeck.gg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Topdeck.gg
          </Link>
        </span>
      </Stack>
    </Box>
  );
}
