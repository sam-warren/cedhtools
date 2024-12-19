import React from 'react';
import LinearProgress from '@mui/joy/LinearProgress';
import Box from '@mui/joy/Box';
import { useLoading } from 'src/contexts/LoadingContext';

const AppLoader: React.FC = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '4px',
        position: 'sticky',
      }}
    >
      <LinearProgress
        variant="soft"
        sx={{
          width: '100%',
          height: '4px',
        }}
      />
    </Box>
  );
};

export default AppLoader;
