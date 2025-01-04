import React, { useEffect } from 'react';
import { useAlert } from 'contexts/AlertContext';
import Box from '@mui/joy/Box';
import Alert from '@mui/joy/Alert';
import { AlertSeverity } from 'src/types';
import { IconButton } from '@mui/joy';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InfoIcon from '@mui/icons-material/Info';
import DangerousIcon from '@mui/icons-material/Dangerous';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const AppAlert: React.FC = () => {
  const { alerts, removeAlert } = useAlert();

  useEffect(() => {
    if (alerts.length > 0) {
      const timers = alerts.map((alert) =>
        setTimeout(() => removeAlert(alert.id), 5000),
      );
      return () => timers.forEach((timer) => clearTimeout(timer));
    }
  }, [alerts, removeAlert]);

  if (alerts.length === 0) return null;

  const getStartDecorator = (severity: AlertSeverity) => {
    switch (severity) {
      case 'primary':
        return <InfoIcon />;
      case 'success':
        return <CheckCircleIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'danger':
        return <DangerousIcon />;
      case 'neutral':
        return <InfoIcon />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: '350px',
        maxWidth: '350px',
      }}
    >
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          variant="soft"
          color={alert.severity}
          startDecorator={getStartDecorator(alert.severity)}
          endDecorator={
            <IconButton
              variant="soft"
              color={alert.severity}
              onClick={() => removeAlert(alert.id)}
            >
              <CloseRoundedIcon />
            </IconButton>
          }
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {alert.message}
        </Alert>
      ))}
    </Box>
  );
};
