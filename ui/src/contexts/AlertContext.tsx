import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertContextProps, AlertMessage, AlertSeverity } from 'src/types';

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const showAlert = (message: string, severity: AlertSeverity = 'primary') => {
    const id = Math.random().toString(16).slice(2);
    setAlerts((prev) => [...prev, { id, message, severity }]);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextProps => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
