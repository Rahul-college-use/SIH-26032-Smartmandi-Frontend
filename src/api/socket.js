import { io } from 'socket.io-client';

// Safely derive socket URL without breaking domain names
const RAW_URL = "http:// 10.186.40.204:5000/api" || "http://localhost:5000/api" || import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://localhost:5000';
const SOCKET_URL = RAW_URL.replace(/\/api\/?$/, '');

// Single shared socket instance with reconnect & auth handling
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  auth: (cb) => {
    cb({ token: localStorage.getItem('token') || '' });
  }
});

// Debugging listeners for development
if (import.meta.env.DEV) {
  socket.on('connect', () => {
    console.log(`[Socket] Connected to ${SOCKET_URL} (ID: ${socket.id})`);
  }); 

  socket.on('connect_error', (err) => {
    console.warn(`[Socket Error]`, err.message);
  });
}