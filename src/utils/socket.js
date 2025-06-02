import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL;

// Create a socket instance - Lấy domain từ apiUrl
const socket = io(apiUrl.replace('/api', ''), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling']
});

export default socket; 