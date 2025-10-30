// src/context/SocketContext.jsx
import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// Sesuaikan URL ini dengan server Anda
const SOCKET_URL = "http://localhost:3000"; 
export const socket = io(SOCKET_URL);
const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};