import { createContext, useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { handleGetAccessToken } from '../services/axiosJWT';
import chatService from '../services/chatService';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const user = useSelector((state) => state.user);
    const SERVER_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        let newSocket = null;

        // Kiểm tra người dùng đã đăng nhập bằng nhiều cách
        const accessToken = handleGetAccessToken();
        const userId = user?._id;
        const isLoggedIn = !!(accessToken && userId);

        console.log('Socket trying to connect with auth:', isLoggedIn);
        
        if (isLoggedIn) {
            console.log('Connecting to socket server with token...');
            
            // Cấu hình socket với các options
            newSocket = io(SERVER_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                auth: {
                    token: accessToken
                }
            });

            // Thiết lập listeners
            newSocket.on('connect', () => {
                console.log('Socket connected successfully');
                setConnected(true);
                
                // Gửi thông tin đầy đủ khi join
                const userInfo = {
                    userId: userId,
                    role: user?.role || 'User'
                };
                console.log('Joining socket with user info:', userInfo);
                newSocket.emit('join', userInfo);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setConnected(false);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                setConnected(false);
            });

            setSocket(newSocket);

            // Cleanup khi component unmount
            return () => {
                console.log('Disconnecting socket...');
                if (newSocket) {
                    newSocket.disconnect();
                }
            };
        }

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user, SERVER_URL]);

    // Sử dụng API để gửi tin nhắn thay vì socket
    const sendMessage = async (receiverId, content, chatId = null) => {
        try {
            const accessToken = handleGetAccessToken();
            if (!accessToken) {
                console.warn('Cannot send message: no access token');
                return;
            }
            
            // Xác định role của người dùng
            const isAdmin = user?.role === 'Admin';
            console.log(`Sending message as ${isAdmin ? 'Admin' : 'User'} to:`, receiverId);
            
            // Gửi tin nhắn qua API
            const result = await chatService.sendMessage(accessToken, receiverId, content, chatId);
            
            // Thông báo qua socket nếu có kết nối
            if (socket && connected) {
                console.log('Emitting new message event via socket');
                socket.emit('newMessage', {
                    receiverId,
                    senderId: user._id,
                    senderRole: isAdmin ? 'Admin' : 'User',
                    content,
                    timestamp: new Date().toISOString()
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error sending message via API:', error);
            throw error;
        }
    };

    // Sử dụng cả socket và API để đảm bảo tin nhắn được đánh dấu là đã đọc
    const markAsRead = async (receiverId) => {
        try {
            // Xác định role của người dùng
            const isAdmin = user?.role === 'Admin';
            const sender = isAdmin ? 'Admin' : 'User';
            
            // Gửi qua socket nếu đã kết nối
            if (socket && connected) {
                console.log(`Marking messages as read via socket as ${sender} for:`, receiverId);
                socket.emit('markAsRead', {
                    userId: receiverId,
                    sender: sender
                });
            }
            
            // Luôn gửi qua API để đảm bảo
            const accessToken = handleGetAccessToken();
            if (accessToken) {
                console.log(`Marking messages as read via API as ${sender} for:`, receiverId);
                await chatService.markAsRead(accessToken, receiverId);
            } else {
                console.warn('Cannot mark as read: no access token');
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, connected, sendMessage, markAsRead }}>
            {children}
        </SocketContext.Provider>
    );
}; 