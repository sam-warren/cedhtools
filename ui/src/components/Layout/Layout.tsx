import Box, { BoxProps } from '@mui/joy/Box';

function Root(props: BoxProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          bgcolor: 'background.appBody',
          display: 'flex', // Change to flex
          flexDirection: 'column',
          height: '100vh', // Full viewport height
          overflow: 'hidden', // Prevent body scrolling
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}

function Loader(props: BoxProps) {
  return (
    <Box
      className="AppLoader"
      {...props}
      sx={[
        {
          display: 'flex',
          width: '100%',
          height: '4px',
          position: 'absolute',
          top: '64px',
          zIndex: 1100,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}

function Header(props: BoxProps) {
  return (
    <Box
      component="header"
      className="Header"
      {...props}
      sx={[
        {
          p: 2,
          gap: 2,
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          height: '64px',
          flexShrink: 0,
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}

function Main(props: BoxProps) {
  return (
    <Box
      component="main"
      className="Main"
      {...props}
      sx={[
        {
          p: 2,
          flexGrow: 1,
          overflow: 'auto', // Enable scrolling
          position: 'relative',
          '--ScrollArea-radius': '0', // This might help if MUI Joy is applying custom scrollbar styles
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}

function Footer(props: BoxProps) {
  return (
    <Box
      component="footer"
      className="Footer"
      {...props}
      sx={[
        {
          p: 2,
          gap: 2,
          bgcolor: 'background.surface',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          height: '64px',
          flexShrink: 0, // Prevent footer from shrinking
        },
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}

export default {
  Root,
  Header,
  Loader,
  Main,
  Footer,
};