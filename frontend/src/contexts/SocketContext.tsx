import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{children: React.ReactNode, token: string | null}> = ({ children, token }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (token) {
      const socketInstance = io(import.meta.env.VITE_WS_URL, {
        auth: { token },
        transports: ['websocket']
      });
      setSocket(socketInstance);
      return () => { socketInstance.disconnect(); };
    }
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  return useContext(SocketContext);
};
