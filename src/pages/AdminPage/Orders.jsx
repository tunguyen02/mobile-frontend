import { DeleteOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import {
    Button,
    Popconfirm,
    Table,
    Select,
    message,
    Modal,
    Form,
    Tag,
    Card,
    Typography,
    Divider,
    Input,
    Space,
    Tooltip,
    Descriptions
} from "antd";
import { useState } from "react";
import orderService from "../../services/orderService";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleGetAccessToken } from "../../services/axiosJWT";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

const Orders = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [form] = Form.useForm();
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [searchText, setSearchText] = useState('');

    const { data: ordersData, isPending: isPendingGetAll } = useQuery({
        queryKey: ["orders", "admin"],
        queryFn: async () => {
            const accessToken = handleGetAccessToken();
            return orderService.getAllOrders(accessToken);
        },
        enabled: true,
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
    });

    const editOrderMutation = useMutation({
        mutationFn: async ({ orderId, data }) => {
            console.log(orderId, data);

            const accessToken = handleGetAccessToken();
            return await orderService.changeOrderStatus(accessToken, orderId, data);
        },
        onSuccess: () => {
            message.success("Cập nhật trạng thái đơn hàng thành công!", 3);
            queryClient.invalidateQueries(["orders", "admin"]);
            setIsModalOpen(false);
        },
        onError: (error) => {
            message.error(error.response?.data?.message || error.message);
        },
    });

    const deleteOrderMutation = useMutation({
        mutationFn: async (orderId) => {
            const accessToken = handleGetAccessToken();
            return await orderService.deleteOrder(accessToken, orderId);
        },
        onSuccess: () => {
            message.success("Xóa đơn hàng thành công!", 3);
            queryClient.invalidateQueries(["orders", "admin"]);
            setIsDeleteModalOpen(false);
        },
        onError: (error) => {
            message.error(error.response?.data?.message || error.message);
        },
    });

    const handleDelete = async () => {
        if (orderToDelete) {
            await deleteOrderMutation.mutateAsync(orderToDelete);
        }
    };

    const handleEditOrder = (record) => {
        setCurrentOrder(record);

        form.setFieldsValue({
            shippingStatus: record.order.shippingStatus,
            paymentStatus: record.payment.paymentStatus,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            // Nếu là VNPay, không cho phép sửa trạng thái thanh toán
            if (currentOrder.payment.paymentMethod === 'VNPay') {
                values.paymentStatus = currentOrder.payment.paymentStatus;
            }

            await editOrderMutation.mutateAsync({
                orderId: currentOrder.order._id,
                data: values,
            });
        } catch (error) {
            console.log("Validation failed:", error);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const filteredOrders = ordersData?.data?.filter(
        (order) => {
            const name = order.order?.shippingInfo?.name || '';
            const email = order.order?.userId?.email || '';
            const searchValue = searchText.toLowerCase();
            return name.toLowerCase().includes(searchValue) ||
                email.toLowerCase().includes(searchValue);
        }
    ) || [];

    const columns = [
        {
            title: "STT",
            dataIndex: "no",
            key: "no",
            align: "center",
            render: (text, record, index) => (
                <Tag color="blue" className="text-center font-medium">
                    {index + 1}
                </Tag>
            ),
            width: 60
        },
        {
            title: "Tên người nhận",
            dataIndex: ["order", "shippingInfo", "name"],
            key: "shippingInfo.name",
            render: (text) => <Text strong>{text || "Không có thông tin"}</Text>,
            width: 130
        },
        {
            title: "Email người dùng",
            dataIndex: ["order", "userId", "email"],
            key: "userId.email",
            render: (text) => text || "Không có thông tin",
            width: 180
        },
        {
            title: "Trạng thái vận chuyển",
            dataIndex: ["order", "shippingStatus"],
            key: "shippingStatus",
            render: (text) => {
                const statusMap = {
                    Pending: "Chờ xử lý",
                    Processing: "Đang xử lý",
                    Shipping: "Đang giao",
                    Completed: "Hoàn thành",
                    Cancelled: "Đã hủy"
                };
                let color = "default";
                if (text === "Pending") color = "orange";
                else if (text === "Processing") color = "purple";
                else if (text === "Shipping") color = "blue";
                else if (text === "Completed") color = "green";
                else if (text === "Cancelled") color = "red";

                return <Tag color={color}>{statusMap[text] || "Không xác định"}</Tag>;
            },
            width: 130,
            align: "center"
        },
        {
            title: "Trạng thái thanh toán",
            dataIndex: ["payment", "paymentStatus"],
            key: "paymentStatus",
            render: (text, record) => {
                const paymentMap = {
                    Pending: "Chưa thanh toán",
                    Completed: "Đã thanh toán",
                    Expired: "Hết hạn thanh toán",
                    Refund_Pending: "Đang chờ hoàn tiền",
                    Refunded: "Đã hoàn tiền",
                    Refund_Failed: "Hoàn tiền thất bại"
                };

                let color = "default";
                if (text === "Pending") color = "orange";
                else if (text === "Completed") color = "green";
                else if (text === "Expired") color = "red";
                else if (text === "Refund_Pending") color = "blue";
                else if (text === "Refunded") color = "cyan";
                else if (text === "Refund_Failed") color = "red";

                return <Tag color={color}>{paymentMap[text] || "Không xác định"}</Tag>;
            },
            width: 150,
            align: "center"
        },
        {
            title: "Phương thức thanh toán",
            dataIndex: ["payment", "paymentMethod"],
            key: "paymentMethod",
            render: (text) => text || "Không có thông tin",
            width: 130
        },
        {
            title: "Tổng giá trị đơn hàng",
            dataIndex: ["order", "totalPrice"],
            key: "totalPrice",
            align: "right",
            render: (text) => {
                if (text) {
                    return (
                        <Text className="text-red-600 font-bold text-base">
                            {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            }).format(text)}
                        </Text>
                    );
                }
                return "Không có thông tin";
            },
            width: 150
        },
        {
            title: "Thời gian đặt hàng",
            dataIndex: ["order", "createdAt"],
            key: "createdAt",
            render: (text) => {
                return dayjs(text).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
            },
            width: 140
        },
        {
            title: "Hành động",
            key: "action",
            align: "center",
            width: 100,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="primary"
                            onClick={() => handleEditOrder(record)}
                            icon={<EditOutlined />}
                            shape="circle"
                            className="bg-blue-500 hover:bg-blue-600"
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            danger
                            type="primary"
                            shape="circle"
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                setOrderToDelete(record.order._id);
                                setIsDeleteModalOpen(true);
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Card className="shadow-md">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <Title level={4} className="mb-1">Quản lý đơn hàng</Title>
                    <Text type="secondary">Quản lý danh sách đơn hàng và trạng thái</Text>
                </div>
                <div className="flex items-center gap-3">
                    <Input.Search
                        placeholder="Tìm kiếm theo tên/email..."
                        allowClear
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 250 }}
                    />
                </div>
            </div>

            <Divider className="my-4" />

            <Table
                columns={columns}
                dataSource={filteredOrders}
                loading={isPendingGetAll}
                rowKey={(record) => record.order?._id}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} đơn hàng`,
                }}
                bordered
                scroll={{ x: 'max-content' }}
            />

            {/* Modal for editing */}
            <Modal
                title={<Text strong>Chỉnh sửa trạng thái đơn hàng</Text>}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                centered
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="shippingStatus"
                        label="Trạng thái vận chuyển"
                        rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
                        <Select>
                            <Select.Option value="Pending">Chờ xử lý</Select.Option>
                            <Select.Option value="Processing">Đang xử lý</Select.Option>
                            <Select.Option value="Shipping">Đang giao hàng</Select.Option>
                            <Select.Option value="Completed">Hoàn thành</Select.Option>
                            <Select.Option value="Cancelled">Đã hủy</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="paymentStatus"
                        label="Trạng thái thanh toán"
                        rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}>
                        {currentOrder?.payment?.paymentMethod === 'VNPay' ? (
                            <Select disabled>
                                <Select.Option value={currentOrder?.payment?.paymentStatus}>
                                    {currentOrder?.payment?.paymentStatus === 'Pending' && 'Chưa thanh toán'}
                                    {currentOrder?.payment?.paymentStatus === 'Completed' && 'Đã thanh toán'}
                                    {currentOrder?.payment?.paymentStatus === 'Expired' && 'Hết hạn thanh toán'}
                                    {currentOrder?.payment?.paymentStatus === 'Refund_Pending' && 'Đang chờ hoàn tiền'}
                                    {currentOrder?.payment?.paymentStatus === 'Refunded' && 'Đã hoàn tiền'}
                                    {currentOrder?.payment?.paymentStatus === 'Refund_Failed' && 'Hoàn tiền thất bại'}
                                </Select.Option>
                            </Select>
                        ) : (
                            <Select>
                                <Select.Option value="Pending">Chưa thanh toán</Select.Option>
                                <Select.Option value="Completed">Đã thanh toán</Select.Option>
                            </Select>
                        )}
                    </Form.Item>
                    {currentOrder?.payment?.paymentMethod === 'VNPay' && (
                        <div className="mb-4">
                            <Text type="warning">
                                Trạng thái thanh toán của đơn hàng VNPay được xử lý tự động.
                                {currentOrder?.payment?.paymentStatus.includes('Refund') &&
                                    ' Hoàn tiền được quản lý trong phần Quản lý hoàn tiền.'}
                            </Text>
                        </div>
                    )}
                </Form>
            </Modal>

            {/* Modal for deleting */}
            <Modal
                title={<Text strong>Xóa đơn hàng</Text>}
                open={isDeleteModalOpen}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                centered
            >
                <p>Bạn có chắc muốn xóa đơn hàng này không?</p>
            </Modal>
        </Card>
    );
};

export default Orders;
