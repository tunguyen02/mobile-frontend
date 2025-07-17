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
    const [socketConnected, setSocketConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const lastPollingTimeRef = useRef(0);
    const pingIntervalRef = useRef(null);
    const lastMessageTimestampRef = useRef(null);
    const initialLoadDoneRef = useRef(false);
    const reconnectTimeoutRef = useRef(null);

    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const { messages = [], isChatOpen = false, unreadCounts = {} } = useSelector((state) => state.chat || {});


    const totalUnread = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    // Cập nhật timestamp khi có tin nhắn mới
    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (latestMessage && latestMessage.createdAt) {
                lastMessageTimestampRef.current = new Date(latestMessage.createdAt).toISOString();
            }
        }
    }, [messages]);

    // Thiết lập polling định kỳ để tự động tải tin nhắn mới - chỉ tải tin nhắn mới
    useEffect(() => {
        if (user.role === 'User' && user._id) {
            const startPolling = () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }

                pollingIntervalRef.current = setInterval(() => {
                    const now = Date.now();
                    if (initialLoadDoneRef.current && (isChatOpen || (now - lastPollingTimeRef.current > 30000))) {
                        console.log('Polling for new messages');
                        if (isChatOpen && lastMessageTimestampRef.current) {
                            fetchNewMessages(lastMessageTimestampRef.current);
                        } else if (!isChatOpen) {
                            fetchUnreadCount();
                        }
                        lastPollingTimeRef.current = now;
                    }
                }, 500);
            };

            startPolling();

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }
    }, [user._id, user.role, isChatOpen]);

    // Thiết lập ping định kỳ để giữ kết nối socket
    useEffect(() => {
        if (user.role === 'User' && user._id && socket) {
            const startPing = () => {
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }

                pingIntervalRef.current = setInterval(() => {
                    if (socket.connected) {
                        socket.emit('ping', { userId: user._id });
                    } else {
                        socket.connect();
                        socket.emit('join', { userId: user._id, role: user.role || 'User' });
                    }
                }, 5000);
            };

            startPing();

            return () => {
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
            };
        }
    }, [user._id, user.role]);

    useEffect(() => {
        if (user.role === 'User') {
            // Connect
            try {
                socket.connect();
                console.log('Socket connecting...', socket.id);

                // Lắng nghe sự kiện kết nối
                socket.on('connect', () => {
                    console.log('Socket connected with ID:', socket.id);
                    setSocketConnected(true);
                    socket.emit('join', { userId: user._id, role: user.role || 'User' });
                    console.log('Joined chat as:', { userId: user._id, role: user.role || 'User' });

                    // Tải lại tin nhắn khi kết nối thành công
                    if (isChatOpen) {
                        fetchMessages();
                    } else {
                        fetchUnreadCount();
                    }

                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                        reconnectTimeoutRef.current = null;
                    }
                });

                socket.on('connect_error', (err) => {
                    console.error('Socket connection error:', err);
                    setSocketConnected(false);
                    message.error('Không thể kết nối với server chat');

                    // Thử kết nối lại sau 2 giây
                    if (!reconnectTimeoutRef.current) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                            console.log('Attempting to reconnect after error...');
                            socket.connect();
                            reconnectTimeoutRef.current = null;
                        }, 2000);
                    }
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

                // Xử lý khi socket bị mất kết nối
                socket.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    setSocketConnected(false);

                    if (!reconnectTimeoutRef.current) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (!socket.connected) {
                                console.log('Attempting to reconnect socket...');
                                socket.connect();
                            }
                            reconnectTimeoutRef.current = null;
                        }, 2000);
                    }
                });

                // Xử lý phản hồi từ ping
                socket.on('pong', () => {
                    console.log('Received pong from server');
                });

                fetchUnreadCount();
            } catch (error) {
                console.error('Error setting up socket connection:', error);
                message.error('Không thể khởi tạo kết nối chat');
            }

            return () => {
                console.log('Cleaning up socket connections');
                socket.off('connect');
                socket.off('connect_error');
                socket.off('disconnect');
                socket.off('newMessage');
                socket.off('messagesRead');
                socket.off('typing');
                socket.off('error');
                socket.off('pong');

                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

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
                forceScrollToBottom();
            }, 200);
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // tải tất cả tin nhắn khi mở chat lần đầu
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

            if (response.data?.messages?.length > 0) {
                dispatch(setMessages(response.data.messages || []));

                // Lưu timestamp của tin nhắn mới nhất
                const latestMsg = response.data.messages[response.data.messages.length - 1];
                lastMessageTimestampRef.current = new Date(latestMsg.createdAt).toISOString();

                markAsRead();
                forceScrollToBottom();
            } else {
                dispatch(setMessages([]));
            }

            initialLoadDoneRef.current = true;
        } catch (error) {
            console.error('Error fetching messages:', error);
            message.error('Không thể tải tin nhắn');
        } finally {
            setLoading(false);
        }
    };

    // tải tin nhắn mới
    const fetchNewMessages = async (timestamp) => {
        if (!user._id || !timestamp) {
            return;
        }

        try {
            console.log('Fetching new messages after timestamp:', timestamp);
            const response = await chatService.getNewMessages(user._id, timestamp);

            if (response.data?.messages?.length > 0) {
                console.log('New messages found:', response.data.messages.length);

                const existingMessagesMap = new Map(
                    messages.map(msg => [msg._id, true])
                );

                response.data.messages.forEach(msg => {
                    if (!existingMessagesMap.has(msg._id)) {
                        dispatch(addMessage(msg));
                    }
                });

                const latestMsg = response.data.messages[response.data.messages.length - 1];
                lastMessageTimestampRef.current = new Date(latestMsg.createdAt).toISOString();

                if (isChatOpen) {
                    markAsRead();
                    forceScrollToBottom();
                }
            }
        } catch (error) {
            console.error('Error fetching new messages:', error);
        }
    };

    // tin nhắn chưa đọc
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

    // đánh dấu tin nhắn đã đọc
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

    // xử lý khi có tin nhắn mới
    const handleNewMessage = (data) => {
        console.log('handleNewMessage called with:', data);
        if (!data || !data.messages || !data.messages.length) {
            console.warn('Invalid message data received:', data);
            return;
        }

        const isTemporaryUpdate = data.messages.some(msg => msg.isTempId);

        const newMessages = data.messages;

        const latestMessage = newMessages[newMessages.length - 1];

        if (latestMessage?.createdAt) {
            lastMessageTimestampRef.current = new Date(latestMessage.createdAt).toISOString();
        }

        if (isChatOpen) {
            const existingMessagesMap = new Map(
                messages.map(msg => [msg._id, true])
            );

            const messagesToAdd = [];
            newMessages.forEach(newMsg => {
                if (newMsg.isTempId && existingMessagesMap.has(`real-${newMsg._id.replace('temp-', '')}`)) {
                    return;
                }

                if (!existingMessagesMap.has(newMsg._id)) {
                    messagesToAdd.push(newMsg);
                }
            });

            if (messagesToAdd.length > 0) {
                console.log('Adding new messages to state:', messagesToAdd);

                messagesToAdd.forEach(msg => {
                    dispatch(addMessage(msg));
                });

                markAsRead();

                forceScrollToBottom();
            }
        } else {
            fetchUnreadCount();
        }
    };

    // đánh dấu tin nhắn đã đọc
    const handleMessagesRead = (chat) => {
        dispatch(updateMessageReadStatus({ userId: user._id, readMessages: chat.messages }));
    };

    const handleTyping = ({ isTyping }) => {
        setIsTyping(isTyping);
    };


    // gửi tin nhắn
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

            if (inputRef.current) {
                inputRef.current.focus();
            }

            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: 'User',
                content: messageContent,
                type: 'Text',
                isRead: false,
                createdAt: new Date().toISOString(),
                tempMessage: true
            };

            dispatch(addMessage(tempMessage));
            forceScrollToBottom();

            lastMessageTimestampRef.current = tempMessage.createdAt;

            let messageSent = false;

            const messageConfirmHandler = (data) => {
                console.log('Message confirmation received:', data);
                messageSent = true;

                if (data?.messages?.length > 0) {
                    const newMessage = data.messages[data.messages.length - 1];
                    dispatch(replaceMessage({ tempId: tempMessage._id, newMessage }));

                    lastMessageTimestampRef.current = newMessage.createdAt;
                } else {
                    fetchNewMessages(lastMessageTimestampRef.current);
                }

                socket.off('messageSent', messageConfirmHandler);
            };

            socket.once('messageSent', messageConfirmHandler);

            if (!socket.connected) {
                console.log('Socket not connected, reconnecting...');
                socket.connect();

                socket.once('connect', () => {
                    socket.emit('join', { userId: user._id, role: user.role || 'User' });

                    socket.emit('sendMessage', {
                        userId: user._id,
                        sender: 'User',
                        content: messageContent,
                        type: 'Text'
                    });
                    console.log('Message emitted to socket after reconnection');
                });
            } else {
                socket.emit('sendMessage', {
                    userId: user._id,
                    sender: 'User',
                    content: messageContent,
                    type: 'Text'
                });
                console.log('Message emitted to socket');
            }

            setTimeout(() => {
                if (!messageSent) {
                    console.log('Socket message not confirmed, sending via API');
                    socket.off('messageSent', messageConfirmHandler);

                    chatService.sendMessage(user._id, messageContent)
                        .then((response) => {
                            console.log('Message sent via API:', response);
                            if (response?.data?.messages?.length > 0) {
                                const apiMessage = response.data.messages[response.data.messages.length - 1];
                                dispatch(replaceMessage({ tempId: tempMessage._id, newMessage: apiMessage }));

                                lastMessageTimestampRef.current = apiMessage.createdAt;
                            } else {
                                fetchNewMessages(lastMessageTimestampRef.current || new Date().toISOString());
                            }
                        })
                        .catch(error => {
                            console.error('Error sending message via API:', error);
                            message.error('Không thể gửi tin nhắn');
                            dispatch(markMessageAsFailed(tempMessage._id));
                        });
                }
            }, 800);
        } catch (error) {
            console.error('Error sending message:', error);
            message.error('Không thể gửi tin nhắn');
        }
    };

    const handleInputChange = (e) => {
        if (!user._id) return;

        const isUserTyping = e.target.value.length > 0;
        socket.emit('typing', {
            userId: user._id,
            isTyping: isUserTyping,
            sender: 'User'
        });
    };

    const toggleChat = () => {
        const newChatState = !isChatOpen;
        dispatch(setChatOpen(newChatState));

        if (newChatState) {
            fetchMessages();
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            try {
                messagesEndRef.current.scrollIntoView({
                    behavior: 'instant',
                    block: 'end'
                });
            } catch (error) {
                console.error('Error scrolling to bottom:', error);
                try {
                    const chatContainer = document.querySelector('.chat-messages');
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                } catch (fallbackError) {
                    console.error('Fallback scroll failed:', fallbackError);
                }
            }
        }
    };

    const forceScrollToBottom = () => {
        setTimeout(scrollToBottom, 10);
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 200);
    };

    const renderMessageItem = (message) => {
        const isUser = message.sender === 'User';
        return (
            <div
                key={message._id || `temp-${Date.now()}-${Math.random()}`}
                className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                {!isUser && (
                    <Avatar size="small" className="mr-2" icon={<UserOutlined />} />
                )}
                <div
                    className={`max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-lg ${isUser
                        ? message.failed
                            ? 'bg-red-100 text-red-800 rounded-br-sm'
                            : message.tempMessage
                                ? 'bg-blue-300 text-white rounded-br-sm'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm shadow-md'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-md'
                        }`}
                >
                    <div className={`${isUser ? 'text-white' : 'text-gray-800'} ${message.failed ? 'text-red-800' : ''} break-words`}>
                        {message.content}
                    </div>
                    <div
                        className={`text-xs mt-1 text-right flex items-center justify-end ${isUser
                            ? message.failed
                                ? 'text-red-600'
                                : message.tempMessage
                                    ? 'text-blue-200'
                                    : 'text-blue-200'
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

    if (!user._id) {
        return null;
    }

    return (
        <>
            <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
                {!isChatOpen && (
                    <Badge count={totalUnread} offset={[-5, 5]}>
                        <Button
                            type="primary"
                            shape="circle"
                            size="large"
                            icon={<MessageOutlined />}
                            onClick={toggleChat}
                            className="bg-blue-500 hover:bg-blue-600 shadow-lg w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] flex items-center justify-center"
                        />
                    </Badge>
                )}

                {isChatOpen && (
                    <div className="bg-white rounded-lg shadow-xl w-[300px] sm:w-[350px] h-[450px] sm:h-[500px] flex flex-col overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex justify-between items-center">
                            <h3 className="m-0 font-medium text-base">Hỗ trợ trực tuyến</h3>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={toggleChat}
                                className="text-white hover:text-gray-200 p-0"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 chat-messages">
                            {loading ? (
                                <div className="h-full flex justify-center items-center">
                                    <Spin />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex justify-center items-center text-gray-500">
                                    Hãy bắt đầu cuộc trò chuyện
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {messages.map(renderMessageItem)}
                                    {isTyping && (
                                        <div className="inline-block px-3 py-2 bg-white rounded-lg rounded-bl-sm mb-3 text-gray-600 italic self-start shadow-sm">
                                            Admin đang nhập...
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-200">
                            <Form form={form} onFinish={handleSendMessage} className="flex">
                                <Form.Item name="message" className="mb-0 flex-1">
                                    <Input
                                        placeholder="Nhập tin nhắn..."
                                        suffix={<SendOutlined onClick={() => form.submit()} className="text-blue-500 cursor-pointer" />}
                                        ref={inputRef}
                                        onChange={handleInputChange}
                                        onPressEnter={(e) => {
                                            if (!e.shiftKey) {
                                                e.preventDefault();
                                                form.submit();
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Form>
                            {!socketConnected && (
                                <div className="text-xs text-red-500 mt-1 text-center">
                                    Đang kết nối lại...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ChatBubble; 