import React, { useEffect } from 'react';
import { useAlert } from 'contexts/AlertContext';
import Box from '@mui/joy/Box';
import Alert from '@mui/joy/Alert';
import { AlertSeverity } from 'src/types';

export const AppAlert: React.FC = () => {
  const { alerts, removeAlert } = useAlert();

  useEffect(() => {
    if (alerts.length > 0) {
      // Auto-remove each alert after 3 seconds
      const timers = alerts.map((alert) =>
        setTimeout(() => removeAlert(alert.id), 3000),
      );
      return () => timers.forEach((timer) => clearTimeout(timer));
    }
  }, [alerts, removeAlert]);

  if (alerts.length === 0) return null;

  const getStartDecorator = (severity: AlertSeverity) => {
    switch (severity) {
      case 'primary':
        return <Box sx={{ fontSize: 24, color: 'primary.main' }}>🚀</Box>;
      case 'success':
        return <Box sx={{ fontSize: 24, color: 'success.main' }}>🎉</Box>;
      case 'warning':
        return <Box sx={{ fontSize: 24, color: 'warning.main' }}>⚠️</Box>;
      case 'danger':
        return <Box sx={{ fontSize: 24, color: 'error.main' }}>🚨</Box>;
      case 'neutral':
        return <Box sx={{ fontSize: 24, color: 'info.main' }}>ℹ️</Box>;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80, // adjust as needed
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: 'calc(100% - 40px)',
        maxWidth: '600px',
      }}
    >
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          variant="soft"
          color={alert.severity}
          startDecorator={getStartDecorator(alert.severity)}
          sx={{ justifyContent: 'space-between' }}
        >
          {alert.message}
        </Alert>
      ))}
    </Box>
  );
};
