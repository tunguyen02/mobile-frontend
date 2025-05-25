import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tag, Typography, Spin, Empty, Button, Tooltip } from 'antd';
import { formatCurrency } from '../../utils/utils';
import { handleGetAccessToken } from '../../services/axiosJWT';
import refundService from '../../services/refundService';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function MyRefunds() {
    const navigate = useNavigate();
    const accessToken = handleGetAccessToken();

    const { data, isLoading, error } = useQuery({
        queryKey: ['user-refunds'],
        queryFn: async () => {
            return refundService.getUserRefunds(accessToken);
        },
        refetchOnWindowFocus: false,
    });

    const renderStatus = (status) => {
        switch (status) {
            case 'Pending':
                return <Tag icon={<ClockCircleOutlined />} color="orange">Đang chờ xử lý</Tag>;
            case 'Approved':
                return <Tag icon={<CheckCircleOutlined />} color="blue">Đã phê duyệt</Tag>;
            case 'Processed':
                return <Tag icon={<CheckCircleOutlined />} color="cyan">Đã hoàn tiền</Tag>;
            case 'Rejected':
                return <Tag icon={<CloseCircleOutlined />} color="red">Đã từ chối</Tag>;
            case 'Failed':
                return <Tag icon={<CloseCircleOutlined />} color="red">Hoàn tiền thất bại</Tag>;
            default:
                return <Tag icon={<QuestionCircleOutlined />} color="default">Không xác định</Tag>;
        }
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: ['orderId', '_id'],
            key: 'orderId',
            render: (text) => <a onClick={() => navigate(`/order/details/${text}`)}>{text}</a>,
        },
        {
            title: 'Số tiền hoàn',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <Text strong className="text-red-500">
                    {formatCurrency(amount)}
                    <sup>₫</sup>
                </Text>
            ),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => renderStatus(status),
        },
        {
            title: 'Ngày yêu cầu',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'adminNote',
            key: 'adminNote',
            render: (note) => note || '-',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <Text type="danger">Đã xảy ra lỗi khi tải thông tin hoàn tiền: {error.message}</Text>
                <div className="mt-4">
                    <Button onClick={() => window.location.reload()}>Thử lại</Button>
                </div>
            </div>
        );
    }

    const refunds = data?.refunds || [];

    return (
        <div className="py-10 px-12 bg-gray-100 min-h-screen">
            <Card className="shadow-md">
                <div className="mb-6">
                    <Title level={2} className="text-center">Yêu cầu hoàn tiền của tôi</Title>
                    <Text className="block text-center text-gray-500">
                        Danh sách các yêu cầu hoàn tiền của bạn và trạng thái xử lý
                    </Text>
                </div>

                {refunds.length > 0 ? (
                    <Table
                        dataSource={refunds}
                        columns={columns}
                        rowKey="_id"
                        pagination={false}
                    />
                ) : (
                    <Empty
                        description="Bạn chưa có yêu cầu hoàn tiền nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}

                <div className="mt-6 flex justify-center">
                    <Button type="primary" onClick={() => navigate('/my-orders')}>
                        Quay lại đơn hàng của tôi
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default MyRefunds; 