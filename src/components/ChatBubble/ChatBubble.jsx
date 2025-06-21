import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Badge, Input, Form, Avatar, List, Typography, Spin, message } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import socket from '../../utils/socket';
import chatService from '../../services/chatService';
import {
    setMessages,
    addMessage,
    setUnreadCount,
    setChatOpen,
    updateMessageReadStatus,
    replaceMessage,
    markMessageAsFailed
} from '../../redux/chatSlice';

const { Text } = Typography;

const ChatBubble = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const { messages = [], isChatOpen = false, unreadCounts = {} } = useSelector((state) => state.chat || {});

    console.log('User info in ChatBubble:', user); // Debug info
    console.log('Chat state:', { messages, isChatOpen, unreadCounts }); // Debug chat state

    const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    useEffect(() => {
        if (user.role === 'User') {
            // Connect to socket
            try {
                socket.connect();
                console.log('Socket connecting...', socket.id);

                // Setup socket event listeners
                socket.on('connect', () => {
                    console.log('Socket connected with ID:', socket.id);
                    socket.emit('join', { userId: user._id, role: user.role || 'User' });
                    console.log('Joined chat as:', { userId: user._id, role: user.role || 'User' });
                });

                socket.on('connect_error', (err) => {
                    console.error('Socket connection error:', err);
                    message.error('Không thể kết nối với server chat');
                });

                // Socket event listeners
                socket.on('newMessage', (data) => {
                    console.log('New message received:', data);
                    handleNewMessage(data);
                });

                socket.on('messagesRead', (data) => {
                    console.log('Messages read notification:', data);
                    handleMessagesRead(data);
                });

                socket.on('typing', (data) => {
                    console.log('Typing event:', data);
                    handleTyping(data);
                });

                socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    message.error(`Lỗi: ${error}`);
                });

                // Get unread message count
                fetchUnreadCount();
            } catch (error) {
                console.error('Error setting up socket connection:', error);
                message.error('Không thể khởi tạo kết nối chat');
            }

            return () => {
                console.log('Cleaning up socket connections');
                socket.off('connect');
                socket.off('connect_error');
                socket.off('newMessage');
                socket.off('messagesRead');
                socket.off('typing');
                socket.off('error');
                socket.disconnect();
            };
        }
    }, [user._id]);

    useEffect(() => {
        if (isChatOpen && user._id) {
            fetchMessages();
        }
    }, [isChatOpen, user._id]);

    useEffect(() => {
        if (isChatOpen && messages.length > 0) {
            setTimeout(() => {
                if (messagesEndRef.current) {
                    const chatContainer = messagesEndRef.current.parentElement?.parentElement;
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                    messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
                }
            }, 200);
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const fetchMessages = async () => {
        if (!user._id) {
            console.warn('Cannot fetch messages - user._id is undefined');
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching messages for user:', user._id);
            const response = await chatService.getMessages(user._id);
            console.log('Messages fetched:', response.data);
            dispatch(setMessages(response.data?.messages || []));

            if (response.data?.messages?.length) {
                markAsRead();
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            message.error('Không thể tải tin nhắn');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user._id) {
            console.warn('Cannot fetch unread count - user._id is undefined');
            return;
        }

        try {
            console.log('Fetching unread count for user:', user._id);
            const response = await chatService.getUnreadCount(user._id);
            console.log('Unread count:', response.data);
            dispatch(setUnreadCount({ userId: user._id, count: response.data.count }));
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async () => {
        if (!user._id) {
            console.warn('Cannot mark as read - user._id is undefined');
            return;
        }

        try {
            console.log('Marking messages as read for user:', user._id);
            await chatService.markAsRead(user._id);
            dispatch(setUnreadCount({ userId: user._id, count: 0 }));
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const handleNewMessage = (data) => {
        if (!data || !data.messages || !data.messages.length) {
            console.warn('Invalid message data received:', data);
            return;
        }

        // Lấy tin nhắn mới nhất
        const latestMessage = data.messages[data.messages.length - 1];

        if (isChatOpen) {
            // Kiểm tra xem tin nhắn đã tồn tại trong messages chưa
            const isDuplicate = messages.some(msg =>
                msg._id && latestMessage._id && msg._id === latestMessage._id
            );

            if (!isDuplicate) {
                dispatch(addMessage(latestMessage));
                markAsRead();
            } else {
                console.log('Duplicate message detected, ignoring:', latestMessage);
            }
        } else {
            fetchUnreadCount();
        }
    };

    const handleMessagesRead = (chat) => {
        dispatch(updateMessageReadStatus({ userId: user._id, readMessages: chat.messages }));
    };

    const handleTyping = ({ isTyping }) => {
        setIsTyping(isTyping);
    };

    const handleSendMessage = async (values) => {
        if (!values.message?.trim()) return;

        if (!user._id) {
            console.error('Cannot send message - user._id is undefined');
            message.error('Không thể gửi tin nhắn - ID người dùng không xác định');
            return;
        }

        try {
            const messageContent = values.message.trim();
            form.resetFields();

            // Focus on input after sending
            if (inputRef.current) {
                inputRef.current.focus();
            }

            // Tạo tin nhắn tạm thời để hiển thị ngay
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: 'User',
                content: messageContent,
                type: 'Text',
                isRead: false,
                createdAt: new Date().toISOString(),
                tempMessage: true // Đánh dấu đây là tin nhắn tạm
            };

            // Hiển thị tin nhắn ngay lập tức trong UI
            dispatch(addMessage(tempMessage));
            setTimeout(scrollToBottom, 50);

            // Flag để theo dõi xem tin nhắn đã được gửi thành công chưa
            let messageSent = false;

            // Lắng nghe xác nhận gửi tin nhắn từ server
            const messageConfirmHandler = (data) => {
                console.log('Message confirmation received:', data);
                messageSent = true;

                // Thay thế tin nhắn tạm bằng tin nhắn thật từ server
                if (data?.messages?.length > 0) {
                    const newMessage = data.messages[data.messages.length - 1];
                    dispatch(replaceMessage({ tempId: tempMessage._id, newMessage }));
                } else {
                    // Chỉ fetch lại nếu không nhận được tin nhắn từ server
                    fetchMessages();
                }

                // Remove event listener ngay sau khi nhận được
                socket.off('messageSent', messageConfirmHandler);
            };

            // Thêm listener tạm thời
            socket.once('messageSent', messageConfirmHandler);

            // Emit message
            socket.emit('sendMessage', {
                userId: user._id,
                sender: 'User',
                content: messageContent,
                type: 'Text'
            });

            console.log('Message emitted to socket');

            // Fallback if socket fails - send via API and refresh
            setTimeout(() => {
                if (!messageSent) {
                    console.log('Socket message not confirmed, sending via API');
                    // Hủy socket listener để tránh nhận tin nhắn trùng lặp
                    socket.off('messageSent', messageConfirmHandler);

                    chatService.sendMessage(user._id, messageContent)
                        .then((response) => {
                            console.log('Message sent via API:', response);
                            // Thay thế tin nhắn tạm bằng tin nhắn từ API
                            if (response?.data?.messages?.length > 0) {
                                const apiMessage = response.data.messages[response.data.messages.length - 1];
                                dispatch(replaceMessage({ tempId: tempMessage._id, newMessage: apiMessage }));
                            } else {
                                // Fallback to fetching all messages
                                fetchMessages();
                            }
                        })
                        .catch(error => {
                            console.error('Error sending message via API:', error);
                            message.error('Không thể gửi tin nhắn');
                            // Đánh dấu tin nhắn là đã thất bại
                            dispatch(markMessageAsFailed(tempMessage._id));
                        });
                }
            }, 2000);

        } catch (error) {
            console.error('Error sending message:', error);
            message.error('Không thể gửi tin nhắn');
        }
    };

    const handleInputChange = (e) => {
        if (!user._id) return;

        const isUserTyping = e.target.value.length > 0;
        socket.emit('typing', { userId: user._id, isTyping: isUserTyping, sender: 'User' });
    };

    const toggleChat = () => {
        const newState = !isChatOpen;
        dispatch(setChatOpen(newState));

        if (newState) {
            // Khi mở chat
            fetchMessages().then(() => {
                // Đảm bảo cuộn xuống sau khi fetch xong và render messages
                setTimeout(scrollToBottom, 200);
            });

            if (totalUnread > 0) {
                markAsRead();
            }
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            try {
                messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                    inline: 'nearest'
                });
            } catch (error) {
                console.error('Error scrolling to bottom:', error);
                // Fallback nếu scrollIntoView thất bại
                const chatContainer = messagesEndRef.current.parentElement;
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        }
    };

    const renderMessageItem = (message) => {
        const isUser = message.sender === 'User';

        return (
            <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${isUser
                        ? message.failed
                            ? 'bg-red-100 text-red-800 rounded-br-sm'
                            : message.tempMessage
                                ? 'bg-blue-300 text-white rounded-br-sm'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm shadow'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                >
                    <div className={`${isUser ? 'text-white' : 'text-gray-800'} ${message.failed ? 'text-red-800' : ''}`}>
                        {message.content}
                    </div>
                    <div
                        className={`text-xs mt-1 text-right flex items-center justify-end ${isUser
                            ? message.failed
                                ? 'text-red-600'
                                : message.tempMessage
                                    ? 'text-blue-200'
                                    : 'text-blue-100'
                            : 'text-gray-500'
                            }`}
                    >
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isUser && (
                            <span className="ml-1">
                                {message.failed ? (
                                    <span title="Gửi thất bại">⚠️</span>
                                ) : message.tempMessage ? (
                                    <span title="Đang gửi">⏱️</span>
                                ) : message.isRead ? (
                                    <span title="Đã đọc">✓✓</span>
                                ) : (
                                    <span title="Đã gửi">✓</span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {user.role === 'User' && (isChatOpen ? (
                <div className="w-[350px] h-[500px] bg-white rounded-xl overflow-hidden flex flex-col shadow-lg border border-gray-200">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-2 font-medium">
                            <Avatar icon={<UserOutlined />} /> Support Chat
                        </div>
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={toggleChat}
                            className="text-white hover:text-gray-200"
                        />
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
                        {loading ? (
                            <div className="h-full flex justify-center items-center">
                                <Spin />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex justify-center items-center">
                                <Text type="secondary">No messages yet. Start a conversation!</Text>
                            </div>
                        ) : (
                            <div className="min-h-full">
                                {messages.map((message, index) => (
                                    <div key={message._id || `msg-${index}`}>
                                        {renderMessageItem(message)}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="inline-block px-3 py-2 bg-white rounded-lg rounded-bl-sm mb-3 text-gray-600 italic">
                                        Admin is typing...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <Form form={form} onFinish={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                        <Form.Item name="message" className="mb-0">
                            <Input
                                placeholder="Type a message..."
                                suffix={<SendOutlined onClick={() => form.submit()} className="text-blue-500 cursor-pointer" />}
                                onChange={handleInputChange}
                                ref={inputRef}
                                onPressEnter={(e) => {
                                    if (!e.shiftKey) {
                                        e.preventDefault();
                                        form.submit();
                                    }
                                }}
                            />
                        </Form.Item>
                    </Form>
                </div>
            ) : (
                <Badge count={totalUnread} overflowCount={99}>
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<MessageOutlined />}
                        onClick={toggleChat}
                        className="w-[60px] h-[60px] flex justify-center items-center shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                    />
                </Badge>
            ))}
        </div>
    );
};

export default ChatBubble; 