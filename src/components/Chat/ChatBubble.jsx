import React from 'react';
import { Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';

const { Text } = Typography;

const ChatBubble = ({ message, isUser }) => {
    const { content, createdAt, isRead, sender } = message;
    const formattedTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {!isUser && (
                <Avatar
                    icon={<UserOutlined />}
                    className="mr-2 bg-blue-500"
                />
            )}
            <div>
                <div
                    className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                        isUser
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                >
                    <Text className={isUser ? 'text-white' : 'text-gray-800'}>
                        {content}
                    </Text>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    <span>{formattedTime}</span>
                    {isUser && (
                        <span className="ml-2">{isRead ? 'Đã xem' : 'Đã gửi'}</span>
                    )}
                </div>
            </div>
            {isUser && (
                <Avatar
                    icon={<UserOutlined />}
                    className="ml-2 bg-green-500"
                />
            )}
        </div>
    );
};

export default ChatBubble; 