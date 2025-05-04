import React from 'react';
import { Typography } from 'antd';
import AdminChatPanel from '../../components/Chat/AdminChatPanel';

const { Title } = Typography;

const AdminChat = () => {
    return (
        <div className="h-full">
            <Title level={2} className="mb-4">Quản lý Chat</Title>
            <div className="h-[calc(100vh-180px)]">
                <AdminChatPanel />
            </div>
        </div>
    );
};

export default AdminChat; 