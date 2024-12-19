export type AlertSeverity =
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'primary';

export interface AlertMessage {
  id: string;
  message: string;
  severity: AlertSeverity;
}

export interface AlertContextProps {
  alerts: AlertMessage[];
  showAlert: (message: string, severity?: AlertSeverity) => void;
  removeAlert: (id: string) => void;
}
