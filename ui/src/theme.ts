import { extendTheme } from '@mui/joy/styles';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          // Typically, Joy uses `background.body` for the full page background.
          body: '#f6f7f9', 
          // You can also change other surfaces if you want, e.g.:
          // surface: '#ffffff',
          // level1: '#f0f0f0', 
        },
      },
    },
    dark: {
      palette: {
        background: {
          body: '#121212',
        },
      },
    },
  },
});

export default theme;