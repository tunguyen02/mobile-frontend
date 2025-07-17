import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL;

const socket = io(apiUrl.replace('/api', ''), {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling']
});

export default socket; 