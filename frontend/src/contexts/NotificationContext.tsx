import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const NotificationContext = createContext<any>(null);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notification, setNotification] = useState<{message: string, severity: 'success'|'error'|'info'|'warning'}|null>(null);
  const [open, setOpen] = useState(false);

  const notify = (message: string, severity: 'success'|'error'|'info'|'warning' = 'info') => {
    setNotification({ message, severity });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={notification?.severity || 'info'} sx={{ width: '100%' }}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
