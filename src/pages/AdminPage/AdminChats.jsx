import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, List, Avatar, Badge, Input, Form, Button, Tabs, Typography, Spin, Empty, message } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
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
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const { messages, activeChat, allChats } = useSelector((state) => state.chat);


    useEffect(() => {
        if (user.role === 'Admin') {
            // Connect to socket
            socket.connect();
            console.log('Admin socket connecting...');
            socket.emit('join', { userId: user._id, role: user.role });
            console.log('Emitted join event with:', { userId: user._id, role: user.role });

            // Load all chats
            fetchAllChats();

            // Setup socket event listeners
            setupSocketListeners();

            return () => {
                cleanupSocketListeners();
            };
        }
    }, [user._id, user.role]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchAllChats = async () => {
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
    };

    const fetchMessages = async (userId) => {
        try {
            setChatLoading(true);
            const response = await chatService.getMessages(userId);

            if (activeChat?.userId?._id === userId) {
                dispatch(setMessages(response.data?.messages || []));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            message.error('Không thể tải tin nhắn');
        } finally {
            setChatLoading(false);
        }
    };

    const markAsRead = async (userId) => {
        try {
            await chatService.markAsRead(userId);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleNewUserMessage = ({ userId, message }) => {
        if (!userId || !message || !message._id) {
            console.warn('Invalid message data received:', { userId, message });
            return;
        }

        if (activeChat?.userId?._id === userId) {
            const isDuplicate = messages.some(msg => msg._id === message._id);

            if (!isDuplicate) {
                console.log('Adding new user message to chat:', message);
                dispatch(addMessage(message));
                markAsRead(userId);
                setTimeout(scrollToBottom, 100);
            } else {
                console.log('Duplicate message detected, ignoring:', message);
            }
        } else {
            console.log('Message for non-active chat, refreshing chat list');
            fetchAllChats();
        }
    };

    const handleOnlineUsers = (userIds) => {
        console.log('Online users:', userIds);
    };

    const handleUserOnline = (userId) => {
        console.log('User came online:', userId);
    };

    const handleUserOffline = (userId) => {
        console.log('User went offline:', userId);
    };

    const handleTyping = ({ userId, isTyping }) => {
        setTypingUsers(prev => ({
            ...prev,
            [userId]: isTyping
        }));
    };

    const handleChatSelect = (chat) => {
        dispatch(setActiveChat(chat));
        fetchMessages(chat.userId._id);
        markAsRead(chat.userId._id);
    };

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

            dispatch(addMessage(tempMessage));
            setTimeout(scrollToBottom, 10); // Giảm thời gian timeout

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
                    }

                    socket.off('messageSent', messageConfirmHandler);
                    resolve(data);
                };

                socket.once('messageSent', messageConfirmHandler);
                socket.emit('sendMessage', messageData);

                setTimeout(() => {
                    if (!messageSent) {
                        socket.off('messageSent', messageConfirmHandler);
                        reject(new Error('Socket timeout'));
                    }
                }, 1000);
            });

            socketPromise.catch(async (error) => {
                console.log('Falling back to API due to:', error);

                if (!messageSent) {
                    try {
                        const response = await chatService.sendMessage(activeChat.userId._id, messageContent);
                        console.log('Message sent via API:', response);

                        if (response?.data?.messages?.length > 0) {
                            const apiMessage = response.data.messages[response.data.messages.length - 1];
                            dispatch(replaceMessage({ tempId: tempMessage._id, newMessage: apiMessage }));
                            messageSent = true;
                        }
                    } catch (apiError) {
                        console.error('Error sending message via API:', apiError);
                        if (!messageSent) {
                            message.error('Không thể gửi tin nhắn');
                            dispatch(markMessageAsFailed(tempMessage._id));
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error sending message:', error);
            message.error('Không thể gửi tin nhắn');
        }
    };

    const handleInputChange = (e) => {
        if (!activeChat) return;

        const isAdminTyping = e.target.value.length > 0;
        socket.emit('typing', {
            userId: activeChat.userId._id,
            isTyping: isAdminTyping,
            sender: 'Admin'
        });
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
            setTimeout(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    };

    useEffect(() => {
        if (activeChat) {
            setTimeout(scrollToBottom, 200);
        }
    }, [activeChat]);

    useEffect(() => {
        if (messages && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const renderMessageItem = (message) => {
        const isAdmin = message.sender === 'Admin';

        return (
            <div key={message._id} className={`mb-3 flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg ${isAdmin
                        ? message.failed
                            ? 'bg-red-100 text-red-800 rounded-br-sm'
                            : message.tempMessage
                                ? 'bg-blue-300 text-white rounded-br-sm'
                                : 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm'
                        }`}
                >
                    <div className="break-words">{message.content}</div>
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

    const setupSocketListeners = () => {
        cleanupSocketListeners();

        // Setup new listeners
        console.log('Setting up admin socket listeners');
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

    const cleanupSocketListeners = () => {
        console.log('Cleaning up admin socket listeners');
        socket.off('newUserMessage');
        socket.off('onlineUsers');
        socket.off('userOnline');
        socket.off('userOffline');
        socket.off('typing');
        socket.off('error');
        socket.off('messageSent');
        socket.disconnect();
    };

    if (user.role !== 'Admin') {
        return (
            <Empty
                description="You don't have permission to view this page"
            />
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden p-6 pb-4">
            <Title level={2} className="mb-4">Chăm sóc khách hàng</Title>

            <div className="flex gap-6 flex-1 overflow-hidden" style={{ maxHeight: "calc(100vh - 150px)" }}>
                <div className="w-[30%] min-w-[300px] flex flex-col overflow-hidden bg-white rounded-lg shadow">
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
                                {allChats.map(chat => {
                                    const lastMessage = chat.messages[chat.messages.length - 1];
                                    const hasUnread = chat.messages.some(msg =>
                                        msg.sender === 'User' && !msg.isRead
                                    );

                                    return (
                                        <div
                                            key={chat._id}
                                            onClick={() => handleChatSelect(chat)}
                                            className={`p-3 cursor-pointer transition hover:bg-gray-100 ${activeChat?.userId?._id === chat.userId._id ? 'bg-blue-50' : ''}`}
                                        >
                                            <div className="flex items-center">
                                                <Badge dot={hasUnread} status="processing">
                                                    <Avatar icon={<UserOutlined />} src={chat.userId.avatarUrl} />
                                                </Badge>
                                                <div className="ml-3 flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <Text>{chat.userId.name || chat.userId.email}</Text>
                                                        <Text type="secondary" className="text-xs">
                                                            {chat.status === 'Open' ? (
                                                                <Badge status="success" text="Open" />
                                                            ) : (
                                                                <Badge status="default" text="Closed" />
                                                            )}
                                                        </Text>
                                                    </div>
                                                    {lastMessage ? (
                                                        <Text ellipsis className="text-gray-500">
                                                            {lastMessage.content}
                                                        </Text>
                                                    ) : (
                                                        <Text type="secondary">No messages yet</Text>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow">
                    {activeChat ? (
                        <>
                            {/* Header chat - làm ngắn hơn */}
                            <div className="py-2 px-4 border-b border-gray-200 bg-white">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Text strong className="mr-2">{activeChat.userId?.name || activeChat.userId?.email}</Text>
                                        <Text type="secondary">
                                            {activeChat.status === 'Open' ?
                                                <Badge status="success" text="Open" /> :
                                                <Badge status="default" text="Closed" />
                                            }
                                        </Text>
                                    </div>
                                    <div>
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
                            </div>

                            <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                                {chatLoading ? (
                                    <div className="h-full flex justify-center items-center">
                                        <Spin />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex justify-center items-center text-gray-500">
                                        No messages yet
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {messages.map(message => renderMessageItem(message))}
                                        {typingUsers[activeChat.userId._id] && (
                                            <div className="inline-block px-3 py-2 bg-white rounded-lg rounded-bl-sm mb-3 text-gray-600 italic self-start">
                                                User is typing...
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
                                            placeholder="Type a message..."
                                            suffix={<SendOutlined onClick={() => form.submit()} />}
                                            onChange={handleInputChange}
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
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex justify-center items-center text-gray-500">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChats; 