import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Tag, Typography, Button, Space, Modal, Form, Input, message, Divider, Tooltip } from 'antd';
import { formatCurrency } from '../../utils/utils';
import { handleGetAccessToken } from '../../services/axiosJWT';
import refundService from '../../services/refundService';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

function RefundManagement() {
    const [form] = Form.useForm();
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-refunds'],
        queryFn: async () => {
            const accessToken = handleGetAccessToken();
            return refundService.getAllRefunds(accessToken);
        },
        refetchOnWindowFocus: false,
    });

    const approveMutation = useMutation({
        mutationFn: async ({ refundId, adminNote }) => {
            const accessToken = handleGetAccessToken();
            return refundService.approveRefund(accessToken, refundId, adminNote);
        },
        onSuccess: () => {
            message.success('Đã phê duyệt yêu cầu hoàn tiền thành công!');
            queryClient.invalidateQueries(['admin-refunds']);
            setApproveModalVisible(false);
            form.resetFields();
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Đã xảy ra lỗi khi phê duyệt yêu cầu hoàn tiền');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ refundId, reason }) => {
            const accessToken = handleGetAccessToken();
            return refundService.rejectRefund(accessToken, refundId, reason);
        },
        onSuccess: () => {
            message.success('Đã từ chối yêu cầu hoàn tiền!');
            queryClient.invalidateQueries(['admin-refunds']);
            setRejectModalVisible(false);
            form.resetFields();
        },
        onError: (error) => {
            message.error(error.response?.data?.message || 'Đã xảy ra lỗi khi từ chối yêu cầu hoàn tiền');
        }
    });

    const showApproveModal = (record) => {
        setSelectedRefund(record);
        setApproveModalVisible(true);
    };

    const showRejectModal = (record) => {
        setSelectedRefund(record);
        setRejectModalVisible(true);
    };

    const handleApprove = async () => {
        try {
            const values = await form.validateFields();
            await approveMutation.mutateAsync({
                refundId: selectedRefund._id,
                adminNote: values.adminNote
            });
        } catch (error) {
            console.error('Validate Failed:', error);
        }
    };

    const handleReject = async () => {
        try {
            const values = await form.validateFields();
            await rejectMutation.mutateAsync({
                refundId: selectedRefund._id,
                reason: values.reason
            });
        } catch (error) {
            console.error('Validate Failed:', error);
        }
    };

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
                return <Tag color="default">Không xác định</Tag>;
        }
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderId',
            key: 'orderId',
            render: (text) => <span className="font-mono text-xs">{text._id}</span>,
            width: 220,
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
            width: 150,
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            width: 200,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => renderStatus(status),
            width: 150,
        },
        {
            title: 'Ngày yêu cầu',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            width: 150,
        },
        {
            title: 'Ghi chú',
            dataIndex: 'adminNote',
            key: 'adminNote',
            render: (note) => note || '-',
            width: 200,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    {record.status === 'Pending' && (
                        <>
                            <Tooltip title="Phê duyệt">
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    size="small"
                                    className="bg-green-500 hover:bg-green-600"
                                    onClick={() => showApproveModal(record)}
                                />
                            </Tooltip>
                            <Tooltip title="Từ chối">
                                <Button
                                    danger
                                    type="primary"
                                    icon={<StopOutlined />}
                                    size="small"
                                    onClick={() => showRejectModal(record)}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
            width: 120,
        },
    ];

    return (
        <Card className="shadow-md">
            <div className="mb-6">
                <Title level={4} className="mb-1">Quản lý hoàn tiền</Title>
                <Text type="secondary">Xử lý các yêu cầu hoàn tiền từ khách hàng</Text>
            </div>

            <Divider className="my-4" />

            <Table
                columns={columns}
                dataSource={data?.refunds || []}
                loading={isLoading}
                rowKey="_id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} yêu cầu hoàn tiền`,
                }}
                bordered
                scroll={{ x: 'max-content' }}
            />

            {/* Modal phê duyệt hoàn tiền */}
            <Modal
                title="Phê duyệt yêu cầu hoàn tiền"
                open={approveModalVisible}
                onOk={handleApprove}
                onCancel={() => setApproveModalVisible(false)}
                okText="Phê duyệt"
                cancelText="Hủy"
                confirmLoading={approveMutation.isPending}
                okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-600' }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="adminNote"
                        label="Ghi chú (tùy chọn)"
                    >
                        <TextArea rows={4} placeholder="Nhập ghi chú cho yêu cầu hoàn tiền" />
                    </Form.Item>
                    <Text type="warning">
                        Lưu ý: Sau khi phê duyệt, hệ thống sẽ tự động xử lý hoàn tiền cho khách hàng!
                    </Text>
                </Form>
            </Modal>

            {/* Modal từ chối hoàn tiền */}
            <Modal
                title="Từ chối yêu cầu hoàn tiền"
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => setRejectModalVisible(false)}
                okText="Từ chối"
                cancelText="Hủy"
                confirmLoading={rejectMutation.isPending}
                okButtonProps={{ danger: true }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="Lý do từ chối"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối!' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập lý do từ chối yêu cầu hoàn tiền" />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}

export default RefundManagement; 