import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const chatService = {
    getMessages: async (accessToken) => {
        try {
            console.log('Calling getMessages API with token:', accessToken ? 'token exists' : 'no token');
            const response = await axios.get(`${API_URL}/chat/messages`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error.response || error);
            throw new Error(error.response?.data?.message || 'Error fetching messages');
        }
    },

    getAllChats: async (accessToken) => {
        try {
            console.log('Calling getAllChats API with token:', accessToken ? 'token exists' : 'no token');
            const response = await axios.get(`${API_URL}/chat/all`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching chats:', error.response || error);
            throw new Error(error.response?.data?.message || 'Error fetching chats');
        }
    },

    markAsRead: async (accessToken, receiverId = null) => {
        try {
            console.log('Calling markAsRead API with token:', accessToken ? 'token exists' : 'no token');
            
            // Nếu có receiverId (trường hợp đánh dấu tin nhắn nhận từ người dùng cụ thể)
            if (receiverId) {
                const response = await axios.put(`${API_URL}/chat/mark-read/${receiverId}`, {}, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                return response.data;
            } 
            // Trường hợp đánh dấu tin nhắn của người dùng hiện tại
            else {
                const response = await axios.put(`${API_URL}/chat/mark-read`, {}, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                return response.data;
            }
        } catch (error) {
            console.error('Error marking as read:', error.response || error);
            throw new Error(error.response?.data?.message || 'Error marking messages as read');
        }
    },

    // Gửi tin nhắn đến người dùng/admin
    sendMessage: async (accessToken, receiverId, content, chatId = null) => {
        try {
            console.log(`Sending message API call - To: ${receiverId}, ChatId: ${chatId}`);
            
            const payload = {
                userId: receiverId,
                content,
                chatId
            };
            
            const response = await axios.post(`${API_URL}/chat/send`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            
            console.log('Message API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error.response || error);
            throw new Error(error.response?.data?.message || 'Error sending message');
        }
    },

    // Lấy tin nhắn với userId cụ thể
    getSpecificUserMessages: async (token, userId) => {
        try {
            console.log(`Fetching messages for user ID: ${userId}`);
            const response = await axios.get(`${API_URL}/chat/messages/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log('API Response:', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error getting messages for user ${userId}:`, error);
            throw error;
        }
    }
};

export default chatService; 