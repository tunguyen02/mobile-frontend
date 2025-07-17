import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, List, Avatar, Badge, Input, Form, Button, Tabs, Typography, Spin, Empty, message } from 'antd';
import { UserOutlined, SendOutlined, SyncOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import socket from '../../utils/socket';
import chatService from '../../services/chatService';
import {
    setMessages,
    addMessage,
    setActiveChat,
    setAllChats,
    updateChatStatus,
    replaceMessage,
    markMessageAsFailed
} from '../../redux/chatSlice';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

const AdminChats = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [socketConnected, setSocketConnected] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const lastMessageTimestampRef = useRef({});
    const pollingIntervalRef = useRef(null);
    const socketPingIntervalRef = useRef(null);

    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const { messages, activeChat, allChats } = useSelector((state) => state.chat);

    const fetchAllChats = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching all chats for admin');
            const response = await chatService.getAllChats();
            console.log('All chats response:', response);
            dispatch(setAllChats(response.data));
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    const fetchMessages = useCallback(async (userId) => {
        try {
            setChatLoading(true);
            console.log(`Fetching messages for user: ${userId}`);
            const response = await chatService.getMessages(userId);

            if (activeChat?.userId?._id === userId) {
                dispatch(setMessages(response.data?.messages || []));

                if (response.data?.messages?.length > 0) {
                    const sortedMessages = [...response.data.messages].sort((a, b) =>
                        new Date(a.createdAt) - new Date(b.createdAt)
                    );
                    const latestMsg = sortedMessages[sortedMessages.length - 1];
                    lastMessageTimestampRef.current[userId] = new Date(latestMsg.createdAt).toISOString();
                }

                markAsRead(userId);
                forceScrollToBottom();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            message.error('Không thể tải tin nhắn');
        } finally {
            setChatLoading(false);
        }
    }, [activeChat, dispatch]);

    const fetchNewMessages = useCallback(async (userId) => {
        if (!userId || !lastMessageTimestampRef.current[userId]) {
            return fetchMessages(userId);
        }

        try {
            const timestamp = lastMessageTimestampRef.current[userId];
            console.log(`Fetching new messages for user ${userId} after:`, timestamp);

            const response = await chatService.getNewMessages(userId, timestamp);

            if (response.data?.messages?.length > 0 && activeChat?.userId?._id === userId) {
                console.log(`Found ${response.data.messages.length} new messages`);

                response.data.messages.forEach(newMsg => {
                    dispatch(addMessage(newMsg));
                });

                const sortedMessages = [...response.data.messages].sort((a, b) =>
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                if (sortedMessages.length > 0) {
                    const latestMsg = sortedMessages[sortedMessages.length - 1];
                    lastMessageTimestampRef.current[userId] = new Date(latestMsg.createdAt).toISOString();
                }

                forceScrollToBottom();
            }
        } catch (error) {
            console.error('Error fetching new messages:', error);
        }
    }, [activeChat, dispatch, fetchMessages]);

    const markAsRead = useCallback(async (userId) => {
        try {
            await chatService.markAsRead(userId);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, []);

    const handleNewUserMessage = useCallback(({ userId, message }) => {
        console.log('Admin received new message:', { userId, message });

        if (!userId || !message || !message._id) {
            console.warn('Invalid message data received:', { userId, message });
            return;
        }

        fetchAllChats();

        if (activeChat?.userId?._id === userId) {
            console.log('Adding new message to active chat:', message);
            dispatch(addMessage(message));

            markAsRead(userId);

            if (message.createdAt) {
                lastMessageTimestampRef.current[userId] = new Date(message.createdAt).toISOString();
            }

            forceScrollToBottom();
        } else {
            console.log('Message for non-active chat, refreshing chat list only');
        }
    }, [activeChat, dispatch, fetchAllChats, markAsRead]);

    useEffect(() => {
        if (user.role === 'Admin') {
            const initSocket = () => {
                console.log('Admin initializing socket connection...');

                if (!socket.connected) {
                    socket.connect();
                }

                socket.on('connect', () => {
                    console.log('Admin socket connected with ID:', socket.id);
                    setSocketConnected(true);

                    socket.emit('join', { userId: user._id, role: 'Admin' });
                    console.log('Admin joined socket with ID:', user._id);

                    fetchAllChats();
                });

                socket.on('connect_error', (err) => {
                    console.error('Socket connection error:', err);
                    setSocketConnected(false);
                    message.error('Không thể kết nối đến server chat');
                });

                socket.on('disconnect', () => {
                    console.log('Admin socket disconnected');
                    setSocketConnected(false);

                    setTimeout(() => {
                        if (!socket.connected) {
                            console.log('Attempting to reconnect socket...');
                            socket.connect();
                        }
                    }, 1000);
                });

                socket.on('newUserMessage', handleNewUserMessage);
                socket.on('onlineUsers', handleOnlineUsers);
                socket.on('userOnline', handleUserOnline);
                socket.on('userOffline', handleUserOffline);
                socket.on('typing', handleTyping);
                socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    message.error(`Lỗi kết nối: ${error}`);
                });
            };

            initSocket();

            pollingIntervalRef.current = setInterval(() => {
                if (activeChat?.userId?._id) {
                    fetchNewMessages(activeChat.userId._id);
                }
            }, 500);

            socketPingIntervalRef.current = setInterval(() => {
                if (socket.connected) {
                    socket.emit('ping', { userId: user._id });
                } else {
                    console.log('Socket not connected, attempting to reconnect...');
                    socket.connect();
                    socket.emit('join', { userId: user._id, role: 'Admin' });
                }
            }, 5000);

            return () => {
                console.log('Cleaning up socket connections and intervals');
                socket.off('connect');
                socket.off('connect_error');
                socket.off('disconnect');
                socket.off('newUserMessage');
                socket.off('onlineUsers');
                socket.off('userOnline');
                socket.off('userOffline');
                socket.off('typing');
                socket.off('error');

                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }

                if (socketPingIntervalRef.current) {
                    clearInterval(socketPingIntervalRef.current);
                }

                socket.disconnect();
            };
        }
    }, [user._id, user.role, handleNewUserMessage, fetchAllChats, fetchNewMessages]);

    useEffect(() => {
        if (activeChat?.userId?._id) {
            fetchMessages(activeChat.userId._id);
        }
    }, [activeChat, fetchMessages]);

    useEffect(() => {
        if (messages.length > 0) {
            forceScrollToBottom();
        }
    }, [messages]);

    const handleOnlineUsers = useCallback((userIds) => {
        console.log('Online users:', userIds);
    }, []);

    const handleUserOnline = useCallback((userId) => {
        console.log('User came online:', userId);
    }, []);

    const handleUserOffline = useCallback((userId) => {
        console.log('User went offline:', userId);
    }, []);

    const handleTyping = useCallback(({ userId, isTyping }) => {
        setTypingUsers(prev => ({
            ...prev,
            [userId]: isTyping
        }));
    }, []);

    const handleChatSelect = useCallback((chat) => {
        dispatch(setActiveChat(chat));
        fetchMessages(chat.userId._id);
    }, [dispatch, fetchMessages]);

    const handleManualRefresh = useCallback(() => {
        if (activeChat?.userId?._id) {
            message.info('Đang làm mới tin nhắn...');
            fetchMessages(activeChat.userId._id);
        }
    }, [activeChat, fetchMessages]);

    const handleSendMessage = async (values) => {
        if (!activeChat || !values.message?.trim()) return;

        try {
            const messageContent = values.message.trim();
            form.resetFields();

            if (inputRef.current) {
                inputRef.current.focus();
            }

            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: 'Admin',
                content: messageContent,
                type: 'Text',
                isRead: false,
                createdAt: new Date().toISOString(),
                tempMessage: true
            };

            // Add the temporary message
            dispatch(addMessage(tempMessage));
            forceScrollToBottom();

            let messageSent = false;

            const messageData = {
                userId: activeChat.userId._id,
                sender: 'Admin',
                content: messageContent,
                type: 'Text'
            };

            const socketPromise = new Promise((resolve, reject) => {
                const messageConfirmHandler = (data) => {
                    console.log('Socket message confirmation received:', data);
                    messageSent = true;

                    if (data?.messages?.length > 0) {
                        const newMessage = data.messages[data.messages.length - 1];

                        dispatch(replaceMessage({ tempId: tempMessage._id, newMessage }));

                        lastMessageTimestampRef.current[activeChat.userId._id] =
                            new Date(newMessage.createdAt).toISOString();
                    }

                    socket.off('messageSent', messageConfirmHandler);
                    resolve(data);
                };

                socket.once('messageSent', messageConfirmHandler);

                if (!socket.connected) {
                    console.log('Socket not connected, reconnecting before sending message...');
                    socket.connect();

                    socket.once('connect', () => {
                        console.log('Socket reconnected, joining and sending message...');
                        socket.emit('join', { userId: user._id, role: 'Admin' });
                        socket.emit('sendMessage', messageData);
                    });
                } else {
                    console.log('Socket connected, sending message immediately');
                    socket.emit('sendMessage', messageData);
                }

                setTimeout(() => {
                    if (!messageSent) {
                        socket.off('messageSent', messageConfirmHandler);
                        reject(new Error('Socket timeout'));
                    }
                }, 500);
            });

            const apiPromise = chatService.sendMessage(activeChat.userId._id, messageContent)
                .then(response => {
                    console.log('Message sent via API:', response);

                    if (!messageSent && response?.data?.messages?.length > 0) {
                        const apiMessage = response.data.messages[response.data.messages.length - 1];

                        dispatch(replaceMessage({ tempId: tempMessage._id, newMessage: apiMessage }));

                        lastMessageTimestampRef.current[activeChat.userId._id] =
                            new Date(apiMessage.createdAt).toISOString();

                        messageSent = true;
                    }
                    return response;
                })
                .catch(error => {
                    console.error('Error sending message via API:', error);
                    if (!messageSent) {
                        message.error('Không thể gửi tin nhắn');
                        dispatch(markMessageAsFailed(tempMessage._id));
                    }
                    throw error;
                });

            Promise.race([socketPromise, apiPromise])
                .then(() => {
                    console.log('Message sent successfully via either socket or API');
                })
                .catch(error => {
                    console.error('Both socket and API failed:', error);
                });

        } catch (error) {
            console.error('Error sending message:', error);
            message.error('Không thể gửi tin nhắn');
        }
    };

    const handleStatusChange = async (userId, status) => {
        try {
            await chatService.updateStatus(userId, status);
            dispatch(updateChatStatus({ userId, status }));
        } catch (error) {
            console.error('Error updating chat status:', error);
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
                    const chatContainer = document.querySelector('.admin-chat-messages');
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
        const isAdmin = message.sender === 'Admin';
        return (
            <div key={message._id || Date.now()} className={`mb-3 flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                {!isAdmin && (
                    <Badge dot status={message.isRead ? "default" : "processing"}>
                        <Avatar size="small" className="mr-2" icon={<UserOutlined />} />
                    </Badge>
                )}
                <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg ${isAdmin
                        ? message.failed
                            ? 'bg-red-100 text-red-800 rounded-br-sm'
                            : message.tempMessage
                                ? 'bg-blue-300 text-white rounded-br-sm'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm shadow'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                >
                    <div className={`${isAdmin ? 'text-white' : 'text-gray-800'} ${message.failed ? 'text-red-800' : ''}`}>
                        {message.content}
                    </div>
                    <div
                        className={`text-xs mt-1 text-right flex items-center justify-end ${isAdmin
                            ? message.failed
                                ? 'text-red-600'
                                : message.tempMessage
                                    ? 'text-blue-200'
                                    : 'text-blue-100'
                            : 'text-gray-500'
                            }`}
                    >
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isAdmin && (
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

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    if (user.role !== 'Admin') {
        return (
            <Empty
                description="You don't have permission to view this page"
            />
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden p-4 sm:p-6 pb-4">
            <Title level={2} className="mb-4 text-xl sm:text-2xl flex justify-between items-center">
                <span>Chăm sóc khách hàng</span>
                <Button
                    icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={toggleSidebar}
                    className="lg:hidden"
                />
            </Title>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 overflow-hidden" style={{ maxHeight: "calc(100vh - 150px)" }}>
                <div
                    className={`${sidebarCollapsed ? 'hidden' : 'block'} lg:block w-full lg:w-[30%] lg:min-w-[300px] flex flex-col overflow-hidden bg-white rounded-lg shadow transition-all duration-300`}
                >
                    <div className="p-3 border-b">
                        <Tabs defaultActiveKey="all" className="m-0">
                            <TabPane tab="All Chats" key="all" />
                        </Tabs>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="h-full flex justify-center items-center">
                                <Spin />
                            </div>
                        ) : (
                            <>
                                {allChats.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        Không có cuộc trò chuyện nào
                                    </div>
                                ) : (
                                    allChats.map(chat => {
                                        const lastMessage = chat.messages[chat.messages.length - 1];
                                        const hasUnread = chat.messages.some(msg =>
                                            msg.sender === 'User' && !msg.isRead
                                        );

                                        return (
                                            <div
                                                key={chat._id}
                                                onClick={() => {
                                                    handleChatSelect(chat);
                                                    if (window.innerWidth < 1024) {
                                                        setSidebarCollapsed(true);
                                                    }
                                                }}
                                                className={`p-3 cursor-pointer transition hover:bg-gray-100 ${activeChat?.userId?._id === chat.userId._id ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="flex items-center">
                                                    <Badge dot={hasUnread} status="processing">
                                                        <Avatar icon={<UserOutlined />} src={chat.userId.avatarUrl} />
                                                    </Badge>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <div className="flex justify-between items-center">
                                                            <Text ellipsis className="font-medium">{chat.userId.name || chat.userId.email}</Text>
                                                            <Text type="secondary" className="text-xs ml-2 flex-shrink-0">
                                                                {chat.status === 'Open' ? (
                                                                    <Badge status="success" text="Open" />
                                                                ) : (
                                                                    <Badge status="default" text="Closed" />
                                                                )}
                                                            </Text>
                                                        </div>
                                                        {lastMessage ? (
                                                            <div className="flex justify-between items-center">
                                                                <Text ellipsis className="text-gray-500 max-w-[70%]">
                                                                    {lastMessage.content}
                                                                </Text>
                                                                <Text className="text-xs text-gray-400 ml-2">
                                                                    {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </Text>
                                                            </div>
                                                        ) : (
                                                            <Text type="secondary" className="text-xs">Chưa có tin nhắn</Text>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow">
                    {activeChat ? (
                        <>
                            <div className="py-2 px-4 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-2">
                                {sidebarCollapsed && (
                                    <Button
                                        icon={<MenuUnfoldOutlined />}
                                        onClick={toggleSidebar}
                                        size="small"
                                        className="mr-2 lg:hidden"
                                    />
                                )}
                                <div className="flex items-center">
                                    <Avatar
                                        size="small"
                                        className="mr-2"
                                        icon={<UserOutlined />}
                                        src={activeChat.userId?.avatarUrl}
                                    />
                                    <Text strong className="mr-2">{activeChat.userId?.name || activeChat.userId?.email}</Text>
                                    <Text type="secondary">
                                        {activeChat.status === 'Open' ?
                                            <Badge status="success" text="Open" /> :
                                            <Badge status="default" text="Closed" />
                                        }
                                    </Text>
                                </div>
                                <div className="flex items-center">
                                    <Button
                                        size="small"
                                        onClick={handleManualRefresh}
                                        icon={<SyncOutlined />}
                                        className="mr-2"
                                        title="Làm mới tin nhắn"
                                    >
                                        <span className="hidden sm:inline">Làm mới</span>
                                    </Button>
                                    {activeChat.status === 'Open' ? (
                                        <Button size="small" onClick={() => handleStatusChange(activeChat.userId._id, 'Closed')}>
                                            Close Chat
                                        </Button>
                                    ) : (
                                        <Button size="small" onClick={() => handleStatusChange(activeChat.userId._id, 'Open')}>
                                            Reopen Chat
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-gray-100 p-4 admin-chat-messages">
                                {chatLoading ? (
                                    <div className="h-full flex justify-center items-center">
                                        <Spin />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex justify-center items-center text-gray-500">
                                        Chưa có tin nhắn
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {messages.map(message => renderMessageItem(message))}
                                        {typingUsers[activeChat.userId._id] && (
                                            <div className="inline-block px-3 py-2 bg-white rounded-lg rounded-bl-sm mb-3 text-gray-600 italic self-start">
                                                User đang nhập...
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <div className="py-2 px-4 border-t border-gray-200 bg-white">
                                <Form form={form} onFinish={handleSendMessage} className="flex">
                                    <Form.Item name="message" className="mb-0 flex-1">
                                        <Input
                                            placeholder="Nhập tin nhắn..."
                                            suffix={<SendOutlined onClick={() => form.submit()} className="text-blue-500 cursor-pointer" />}
                                            ref={inputRef}
                                            disabled={activeChat.status === 'Closed'}
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
                        </>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-gray-500">
                            {sidebarCollapsed && (
                                <Button
                                    icon={<MenuUnfoldOutlined />}
                                    onClick={toggleSidebar}
                                    className="mb-4 lg:hidden"
                                >
                                    Hiển thị danh sách chat
                                </Button>
                            )}
                            Chọn một cuộc trò chuyện để bắt đầu
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChats; 