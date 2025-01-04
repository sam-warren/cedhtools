import React from 'react';
import LinearProgress from '@mui/joy/LinearProgress';
import Box from '@mui/joy/Box';
import { useLoading } from 'src/contexts/LoadingContext';

const AppLoader: React.FC = () => {
  const { loading } = useLoading();

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '4px',
        position: 'sticky',
        opacity: loading ? 1 : 0,
        transition: 'opacity 0.2s ease-out',
        visibility: loading ? 'visible' : 'hidden',
        transitionDelay: loading ? '0s' : '0.2s',
      }}
    >
      <LinearProgress
        variant="soft"
        determinate={false}
        sx={{
          width: '100%',
          height: '4px',
          '--LinearProgress-radius': '0px',
        }}
      />
    </Box>
  );
};

export default AppLoader;