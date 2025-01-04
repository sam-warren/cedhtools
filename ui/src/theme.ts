import { extendTheme } from '@mui/joy/styles';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        background: {
          body: '#f6f7f9', 
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
  components: {
    JoySheet: {
      styleOverrides: {
        root: {
          '--ScrollArea-radius': '0',
          // Reset any custom scrollbar styles
          '::-webkit-scrollbar': {
            width: 'auto',
            height: 'auto',
            backgroundColor: 'transparent'
          },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: 'auto',
            borderRadius: 'auto'
          }
        }
      }
    }
  }
});

export default theme;