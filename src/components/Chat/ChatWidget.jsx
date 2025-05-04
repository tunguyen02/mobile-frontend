import React, { useState, useEffect } from 'react';
import { Button, Badge, Drawer, Tooltip } from 'antd';
import { CommentOutlined, CloseOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import ChatBox from './ChatBox';
import chatService from '../../services/chatService';
import { handleGetAccessToken } from '../../services/axiosJWT';

const ChatWidget = () => {
    const [visible, setVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [bounceEffect, setBounceEffect] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const user = useSelector((state) => state.user);
    const { socket } = useSocket();
    const adminId = 'admin'; // ID cố định cho admin

    // Kiểm tra xác thực khi component mount và khi user thay đổi
    useEffect(() => {
        checkAuthentication();
    }, [user]);

    // Kiểm tra nếu người dùng đã đăng nhập bằng nhiều cách
    const checkAuthentication = () => {
        const accessToken = handleGetAccessToken();
        const hasUserInfo = user && (user.email || user.name);
        const hasUserToken = user && user.accessToken;
        
        console.log('Access Token:', !!accessToken);
        console.log('User Info:', !!hasUserInfo);
        console.log('User Token:', !!hasUserToken);
        
        setIsAuthenticated(!!(accessToken || hasUserToken));
    };

    // Thêm hiệu ứng bounce để thu hút sự chú ý ngay khi component mount
    useEffect(() => {
        triggerBounceEffect();
        // Gọi lại hiệu ứng mỗi 30 giây để thu hút sự chú ý của người dùng
        const bounceInterval = setInterval(() => {
            triggerBounceEffect();
        }, 30000);
        
        return () => clearInterval(bounceInterval);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadUnreadCount();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', () => {
                loadUnreadCount();
                triggerBounceEffect();
            });

            socket.on('messagesRead', () => {
                setUnreadCount(0);
            });

            return () => {
                socket.off('newMessage');
                socket.off('messagesRead');
            };
        }
    }, [socket]);

    const triggerBounceEffect = () => {
        setBounceEffect(true);
        setTimeout(() => {
            setBounceEffect(false);
        }, 1000);
    };

    const loadUnreadCount = async () => {
        try {
            const accessToken = handleGetAccessToken();
            if (!accessToken) return;
            
            // Sử dụng API getSpecificUserMessages thay vì getMessages để đảm bảo lấy đúng tin nhắn
            const data = await chatService.getSpecificUserMessages(accessToken, user._id);
            if (data && (data.chat || data.data)) {
                const chatData = data.chat || data.data;
                const count = chatData.messages.filter(msg => 
                    msg.sender === 'Admin' && !msg.isRead
                ).length;
                
                console.log(`Found ${count} unread messages`);
                setUnreadCount(count);
                
                if (count > 0 && !visible) {
                    triggerBounceEffect();
                }
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const showDrawer = () => {
        setVisible(true);
        if (isAuthenticated) {
            setUnreadCount(0);
            const accessToken = handleGetAccessToken();
            if (accessToken) {
                // Sử dụng markAsRead với tham số null để đánh dấu tin nhắn của người dùng hiện tại
                chatService.markAsRead(accessToken, null)
                    .then(() => console.log('Messages marked as read'))
                    .catch(error => console.error('Error marking messages as read:', error));
            }
        }
    };

    const onClose = () => {
        setVisible(false);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[9999]">
                <Tooltip title={isAuthenticated ? (unreadCount > 0 ? `${unreadCount} tin nhắn mới` : "Chat với hỗ trợ viên") : "Đăng nhập để chat"}>
                    <Badge count={unreadCount} offset={[-2, 2]}>
                        <Button
                            type="primary"
                            shape="circle"
                            size="large"
                            icon={<CommentOutlined style={{ fontSize: '28px' }} />}
                            onClick={showDrawer}
                            className={`w-16 h-16 flex items-center justify-center shadow-lg chat-button-shadow ${bounceEffect ? 'animate-bounce' : ''}`}
                            style={{ 
                                backgroundColor: '#2e89ff', 
                                borderColor: '#2e89ff',
                                boxShadow: '0 8px 16px 0 rgba(0, 118, 255, 0.5)'
                            }}
                        />
                    </Badge>
                </Tooltip>
            </div>

            <Drawer
                title={
                    <div className="flex justify-between items-center">
                        <span>Hỗ trợ khách hàng</span>
                        <Button 
                            type="text" 
                            icon={<CloseOutlined />} 
                            onClick={onClose}
                            className="border-none"
                        />
                    </div>
                }
                placement="right"
                onClose={onClose}
                open={visible}
                width={380}
                headerStyle={{ padding: '12px 16px' }}
                bodyStyle={{ padding: 0, height: 'calc(100% - 55px)' }}
                destroyOnClose={false}
                closable={false}
            >
                {isAuthenticated ? (
                    <ChatBox receiverId={adminId} onClose={onClose} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <h3 className="text-lg font-medium mb-4">Đăng nhập để chat</h3>
                        <p className="text-center text-gray-500 mb-6">
                            Bạn cần đăng nhập để sử dụng tính năng chat với hỗ trợ viên
                        </p>
                        <Button 
                            type="primary"
                            href="/sign-in"
                            className="w-full"
                        >
                            Đăng nhập ngay
                        </Button>
                    </div>
                )}
            </Drawer>
        </>
    );
};

export default ChatWidget; 