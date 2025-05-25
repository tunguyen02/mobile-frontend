import axios from 'axios';
import { handleGetAccessToken } from './axiosJWT';

const apiUrl = import.meta.env.VITE_API_URL;

const chatService = {
    // Get chat messages for specific user
    getMessages: async (userId) => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.get(`${apiUrl}/chat/messages/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Send a new message
    sendMessage: async (userId, content, type = 'Text') => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.post(`${apiUrl}/chat/send/${userId}`, {
                content,
                type
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Mark messages as read
    markAsRead: async (userId) => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.put(`${apiUrl}/chat/mark-read/${userId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Get unread message count
    getUnreadCount: async (userId) => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.get(`${apiUrl}/chat/unread/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // For admin: Get all chats
    getAllChats: async () => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.get(`${apiUrl}/chat/all`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

    // Update chat status (open/closed)
    updateStatus: async (userId, status) => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.put(`${apiUrl}/chat/status/${userId}`, {
                status
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    }
};

export default chatService; 