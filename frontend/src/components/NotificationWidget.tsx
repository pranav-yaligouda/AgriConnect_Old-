import React, { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../hooks/useNotification';
import { Socket } from 'socket.io-client';

const NotificationWidget: React.FC = () => {
  const socket = useSocket() as Socket | null;
  const { notify } = useNotification() as { notify: (msg: string, severity?: 'success'|'error'|'info'|'warning') => void };

  useEffect(() => {
    if (!socket) return;
    const handleOrderStatus = (order: any) => {
      notify(`Order status updated: ${order.status}`, 'info');
    };
    const handleMessage = (msg: any) => {
      notify(`New message from ${msg.from}: ${msg.text}`, 'info');
    };
    socket.on('order:status', handleOrderStatus);
    socket.on('message', handleMessage);
    // Clean up listeners on unmount
    return () => {
      socket.off('order:status', handleOrderStatus);
      socket.off('message', handleMessage);
    };
  }, [socket, notify]);

  return null; // This widget just listens and notifies
};

export default NotificationWidget;
