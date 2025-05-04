import React, { useState, useEffect } from 'react';
import { Row, Col, List, Avatar, Badge, Typography, Input, Spin, Empty, Button } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';
import ChatBox from './ChatBox';

const { Text, Title } = Typography;

const AdminChatPanel = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const user = useSelector((state) => state.user);
    const { socket } = useSocket();

    useEffect(() => {
        if (user && user.accessToken) {
            loadChats();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', () => {
                loadChats();
            });

            socket.on('messagesRead', () => {
                loadChats();
            });

            return () => {
                socket.off('newMessage');
                socket.off('messagesRead');
            };
        }
    }, [socket]);

    const loadChats = async () => {
        if (!user?.accessToken) return;
        
        try {
            setLoading(true);
            console.log('Admin loading all chats...');
            const data = await chatService.getAllChats(user.accessToken);
            
            if (data && data.chats) {
                console.log(`Loaded ${data.chats.length} chats`);
                
                // Hiển thị thông tin chat để debug
                data.chats.forEach((chat, index) => {
                    console.log(`Chat ${index + 1}:`, {
                        id: chat._id,
                        userId: chat.userId?._id,
                        userName: chat.userId?.name,
                        userEmail: chat.userId?.email,
                        messageCount: chat.messages?.length || 0
                    });
                });
                
                setChats(data.chats);
            } else {
                console.warn('No chats data returned from API');
                setChats([]);
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
    };

    const filteredChats = chats.filter(chat => 
        chat.userId?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        chat.userId?.email?.toLowerCase().includes(searchText.toLowerCase())
    );

    const getUnreadCount = (chat) => {
        return chat.messages.filter(msg => msg.sender === 'User' && !msg.isRead).length;
    };

    return (
        <div className="h-full bg-white rounded-lg shadow-md overflow-hidden">
            <Row className="h-full">
                <Col span={8} className="border-r h-full flex flex-col">
                    <div className="p-4 border-b">
                        <Title level={4}>Tin nhắn</Title>
                        <Input
                            placeholder="Tìm kiếm người dùng"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <Spin />
                            </div>
                        ) : filteredChats.length > 0 ? (
                            <List
                                dataSource={filteredChats}
                                renderItem={chat => {
                                    const unreadCount = getUnreadCount(chat);
                                    const lastMessage = chat.messages.length > 0 
                                        ? chat.messages[chat.messages.length - 1] 
                                        : null;
                                    
                                    // Hiển thị thông tin để debug
                                    console.log(`Rendering chat item for user:`, {
                                        id: chat.userId?._id, 
                                        name: chat.userId?.name,
                                        email: chat.userId?.email
                                    });
                                    
                                    // Đây là tên hiển thị cho người dùng trong chat
                                    const displayName = chat.userId?.name || chat.userId?.email || 'Người dùng không xác định';
                                    
                                    return (
                                        <List.Item
                                            onClick={() => handleSelectChat(chat)}
                                            className={`cursor-pointer hover:bg-gray-100 transition-colors ${
                                                selectedChat?._id === chat._id ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex w-full p-2">
                                                <Badge count={unreadCount} size="small">
                                                    <Avatar icon={<UserOutlined />} />
                                                </Badge>
                                                <div className="ml-3 flex-1 overflow-hidden">
                                                    <div className="flex justify-between">
                                                        <Text strong className="truncate">
                                                            {displayName}
                                                        </Text>
                                                        {lastMessage && (
                                                            <Text type="secondary" className="text-xs">
                                                                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                                                            </Text>
                                                        )}
                                                    </div>
                                                    <Text type="secondary" className="truncate block">
                                                        {lastMessage ? lastMessage.content : 'Chưa có tin nhắn'}
                                                    </Text>
                                                </div>
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        ) : (
                            <Empty description="Không có cuộc trò chuyện nào" className="mt-8" />
                        )}
                    </div>
                    <div className="p-3 border-t">
                        <Button type="primary" onClick={loadChats} block>
                            Làm mới
                        </Button>
                    </div>
                </Col>
                <Col span={16} className="h-full flex flex-col">
                    {selectedChat ? (
                        <ChatBox 
                            receiverId={selectedChat.userId?._id} 
                            onClose={() => setSelectedChat(null)}
                            userName={selectedChat.userId?.name || selectedChat.userId?.email || 'Người dùng'} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Empty description="Chọn một cuộc trò chuyện để bắt đầu" />
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default AdminChatPanel; 