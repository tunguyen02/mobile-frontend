import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Empty, Spin, message, Alert, Avatar } from 'antd';
import { SendOutlined, WarningOutlined, UserOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import ChatBubble from './ChatBubble';
import chatService from '../../services/chatService';
import userService from '../../services/userService';
import { handleGetAccessToken } from '../../services/axiosJWT';

const ChatBox = ({ receiverId, onClose, userName }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [connectionIssue, setConnectionIssue] = useState(false);
    const [adminId, setAdminId] = useState(null);
    const [loadingAdminId, setLoadingAdminId] = useState(false);
    const user = useSelector((state) => state.user);
    const { socket, connected, sendMessage, markAsRead } = useSocket();
    const messagesEndRef = useRef(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [retryAttempts, setRetryAttempts] = useState(0);
    const [selectedUserName, setSelectedUserName] = useState(userName || '');

    useEffect(() => {
        if (userName) {
            setSelectedUserName(userName);
        }
    }, [userName]);

    // Fetch admin ID when receiverId is 'admin'
    useEffect(() => {
        const fetchAdminId = async () => {
            try {
                setLoadingAdminId(true);
                const result = await userService.getAdminId();
                if (result && result.success && result.adminId) {
                    setAdminId(result.adminId);
                    console.log('Admin ID fetched:', result.adminId);
                }
            } catch (error) {
                console.error('Failed to fetch admin ID:', error);
                messageApi.error('Không thể kết nối với admin');
            } finally {
                setLoadingAdminId(false);
            }
        };

        if (receiverId === 'admin' && !adminId) {
            fetchAdminId();
        }
    }, [receiverId, adminId]);

    // Xử lý trường hợp đặc biệt khi receiverId là "admin"
    const actualReceiverId = receiverId === 'admin' && adminId ? adminId : receiverId;

    // Kiểm tra xem có đang chờ lấy admin ID không
    const isWaitingForAdminId = receiverId === 'admin' && !adminId && loadingAdminId;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async (silent = false) => {
        const accessToken = handleGetAccessToken();
        if (!accessToken) return;
        
        try {
            if (!silent) setLoading(true);
            
            // In ra thông tin debug
            console.log('Loading messages - User role:', user.role);
            console.log('Actual receiver ID:', actualReceiverId);
            console.log('User ID:', user._id);
            
            // Xác định chính xác ID gửi đến API
            // Nếu là Admin, cần chỉ định ID của người dùng mà admin đang chat cùng 
            // Nếu là User thường, luôn dùng ID của chính họ
            const targetUserId = user.role === 'Admin' ? actualReceiverId : user._id;
            
            console.log(`Using target user ID for API call: ${targetUserId}`);
            
            // Gọi API với ID đã xác định
            const data = await chatService.getSpecificUserMessages(accessToken, targetUserId);
            
            console.log('Loaded messages data:', data);
            
            if (data && (data.chat || data.data)) {
                // Handle different API response formats
                const chatData = data.chat || data.data;
                if (chatData?.messages) {
                    console.log(`Setting ${chatData.messages.length} messages in state`);
                    setMessages(chatData.messages);
                    
                    // Lưu tên người dùng nếu có
                    if (chatData.userId && user.role === 'Admin') {
                        const userName = chatData.userId.name || chatData.userId.email || 'Không xác định';
                        console.log(`Setting user name for chat: ${userName}`);
                        setSelectedUserName(userName);
                    }
                } else {
                    console.warn('No messages found in response data');
                    setMessages([]);
                }
                
                setConnectionIssue(false);
                setRetryAttempts(0);
                
                // Mark messages as read if there are unread messages from the other party
                if (chatData?.messages && chatData.messages.some(m => 
                    !m.isRead && m.sender !== (user.role === 'Admin' ? 'Admin' : 'User'))
                ) {
                    console.log('Marking messages as read');
                    markAsRead(user.role === 'Admin' ? actualReceiverId : null);
                }
            } else {
                console.warn('Invalid response format:', data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            setConnectionIssue(true);
            
            if (!silent) {
                messageApi.error('Không thể tải tin nhắn. Đang thử lại...');
            }
            
            // Tự động thử lại nếu thất bại (tối đa 3 lần)
            if (retryAttempts < 3) {
                setRetryAttempts(prev => prev + 1);
                setTimeout(() => loadMessages(true), 5000);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Load messages when component mounts or actualReceiverId changes
    useEffect(() => {
        if (actualReceiverId && !isWaitingForAdminId) {
            loadMessages();
            
            // Set up interval to auto-refresh messages
            const refreshInterval = setInterval(() => {
                loadMessages(true); // Load messages silently
            }, 10000);
            
            return () => clearInterval(refreshInterval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actualReceiverId, isWaitingForAdminId]);

    // Set up socket listeners
    useEffect(() => {
        if (socket && actualReceiverId && !isWaitingForAdminId) {
            console.log('Setting up chat socket listeners');
            
            const handleNewMessage = (data) => {
                console.log('New message received via socket:', data);
                
                // Kiểm tra xem có phải tin nhắn liên quan đến cuộc trò chuyện hiện tại không
                // Nếu là Admin:
                //   - Tin nhắn phải từ user mà admin đang chat cùng (senderId === actualReceiverId)
                // Nếu là User:
                //   - Tin nhắn phải từ admin (senderRole === 'Admin')
                const isRelatedToCurrentChat = 
                    (user.role === 'Admin' && data.senderId === actualReceiverId) || 
                    (user.role !== 'Admin' && data.senderRole === 'Admin');
                
                console.log('Is message related to current chat?', isRelatedToCurrentChat);
                
                if (data.timestamp && data.content && data.senderRole && isRelatedToCurrentChat) {
                    // Đối với sự kiện realtime, thêm tin nhắn mới vào state ngay lập tức
                    console.log('Adding realtime message to chat');
                    const newMessage = {
                        _id: 'temp-' + Date.now(),
                        sender: data.senderRole,
                        content: data.content,
                        isRead: false,
                        createdAt: data.timestamp
                    };
                    
                    setMessages(prev => [...prev, newMessage]);
                    
                    // Đánh dấu tin nhắn đã đọc nếu không phải người gửi
                    if (data.senderRole !== (user.role === 'Admin' ? 'Admin' : 'User')) {
                        console.log('Marking incoming message as read');
                        markAsRead(user.role === 'Admin' ? actualReceiverId : null);
                    }
                } else {
                    // Nếu không phải dữ liệu realtime hoàn chỉnh, tải lại tin nhắn từ server
                    loadMessages(true);
                }
            };

            const handleMessagesRead = (data) => {
                console.log('Messages marked as read:', data);
                loadMessages(true);
            };

            const handleError = (error) => {
                console.error('Socket error:', error);
                messageApi.error('Lỗi kết nối. Vui lòng thử lại sau.');
            };

            socket.on('newMessage', handleNewMessage);
            socket.on('messageSent', handleNewMessage);
            socket.on('messagesRead', handleMessagesRead);
            socket.on('error', handleError);

            return () => {
                socket.off('newMessage', handleNewMessage);
                socket.off('messageSent', handleNewMessage);
                socket.off('messagesRead', handleMessagesRead);
                socket.off('error', handleError);
            };
        }
    }, [socket, actualReceiverId, isWaitingForAdminId, markAsRead]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (sending || isWaitingForAdminId) return;
        
        if (inputValue.trim() && actualReceiverId) {
            setSending(true);
            
            try {
                // Xác định ID người nhận tin nhắn
                // Admin luôn gửi cho người dùng cụ thể, User luôn gửi cho admin
                const messageReceiverId = user.role === 'Admin' ? actualReceiverId : adminId;
                console.log('Sending message to:', messageReceiverId, ':', inputValue.trim());
                
                // Add message to UI immediately for better UX
                const tempMessage = {
                    sender: user.role === 'Admin' ? 'Admin' : 'User',
                    content: inputValue.trim(),
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    _id: 'temp-' + Date.now()
                };
                
                setMessages(prev => [...prev, tempMessage]);
                const currentInput = inputValue.trim();
                setInputValue('');
                
                // Send message via API using the correct receiver ID based on role
                await sendMessage(messageReceiverId, currentInput);
                
                // Reload messages after sending
                setTimeout(() => {
                    loadMessages(true);
                }, 1000);
                
                setConnectionIssue(false);
            } catch (error) {
                console.error('Failed to send message:', error);
                messageApi.error('Không thể gửi tin nhắn. Tin nhắn sẽ được gửi khi kết nối lại.');
                setConnectionIssue(true);
            } finally {
                setSending(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleRetry = () => {
        loadMessages();
    };

    return (
        <>
            {contextHolder}
            <div className="flex flex-col h-full">
                {user.role === 'Admin' && (
                    <div className="p-3 bg-blue-50 border-b">
                        <div className="flex items-center">
                            <Avatar icon={<UserOutlined />} />
                            <div className="ml-2">
                                <div className="font-semibold">{selectedUserName || "Người dùng"}</div>
                                <div className="text-xs text-gray-500">ID: {actualReceiverId}</div>
                            </div>
                        </div>
                    </div>
                )}
                {connectionIssue && (
                    <Alert
                        message="Vấn đề kết nối"
                        description="Có vấn đề kết nối với server. Tin nhắn vẫn được lưu và sẽ gửi khi kết nối trở lại."
                        type="warning"
                        showIcon
                        action={
                            <Button size="small" type="primary" onClick={handleRetry}>
                                Thử lại
                            </Button>
                        }
                    />
                )}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {loading || isWaitingForAdminId ? (
                        <div className="flex justify-center items-center h-full">
                            <Spin size="large" />
                            {isWaitingForAdminId && <div className="ml-2">Đang kết nối với admin...</div>}
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((message, index) => (
                            <ChatBubble
                                key={message._id || index}
                                message={message}
                                isUser={message.sender === (user.role === 'Admin' ? 'Admin' : 'User')}
                            />
                        ))
                    ) : (
                        <Empty 
                            description={
                                <div>
                                    <p>Chưa có tin nhắn nào</p>
                                    <p className="text-gray-400 text-xs">Bắt đầu cuộc trò chuyện ngay!</p>
                                </div>
                            } 
                        />
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t">
                    <div className="flex">
                        <Input.TextArea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            className="flex-1 mr-2"
                            disabled={sending || isWaitingForAdminId}
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            loading={sending}
                            disabled={!inputValue.trim() || sending || isWaitingForAdminId}
                        />
                    </div>
                    {!connected && (
                        <div className="text-red-500 text-xs mt-1 flex items-center">
                            <WarningOutlined className="mr-1" /> Đang kết nối lại... Tin nhắn vẫn được lưu.
                        </div>
                    )}
                    {isWaitingForAdminId && (
                        <div className="text-blue-500 text-xs mt-1 flex items-center">
                            <WarningOutlined className="mr-1" /> Đang kết nối với admin...
                        </div>
                    )}
                    {connectionIssue && (
                        <div className="text-orange-500 text-xs mt-1">
                            Tin nhắn sẽ tự động gửi khi kết nối trở lại
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatBox; 