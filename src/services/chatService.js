import axios from 'axios';
import { handleGetAccessToken } from './axiosJWT';

const apiUrl = import.meta.env.VITE_API_URL;

const chatService = {
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

    getNewMessages: async (userId, timestamp) => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.get(`${apiUrl}/chat/new-messages/${userId}`, {
                params: { timestamp },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || error.message;
        }
    },

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