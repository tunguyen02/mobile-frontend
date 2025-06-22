import { DeleteOutlined, EditOutlined, SearchOutlined, FilterOutlined, EyeOutlined, CalendarOutlined } from "@ant-design/icons";
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
    Descriptions,
    List,
    Avatar,
    DatePicker
} from "antd";
import { useState } from "react";
import orderService from "../../services/orderService";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleGetAccessToken } from "../../services/axiosJWT";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import axios from "axios";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Orders = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [orderDetail, setOrderDetail] = useState(null);
    const [form] = Form.useForm();
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [shippingStatusFilter, setShippingStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

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

    const handleViewOrderDetail = async (record) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/order/public/${record.order._id}`);
            if (response.data && response.data.status === 'OK') {
                setOrderDetail(response.data);
                setIsDetailModalOpen(true);
            } else {
                message.error("Không thể lấy thông tin chi tiết đơn hàng");
            }
        } catch (error) {
            console.error("Error fetching order details:", error);
            message.error("Không thể lấy thông tin chi tiết đơn hàng");
        }
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

    const handleClearFilters = () => {
        setShippingStatusFilter('');
        setPaymentStatusFilter('');
        setPaymentMethodFilter('');
        setDateRange(null);
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
    };

    const filteredOrders = ordersData?.data?.filter(
        (order) => {
            const name = order.order?.shippingInfo?.name || '';
            const email = order.order?.userId?.email || '';
            const shippingStatus = order.order?.shippingStatus || '';
            const paymentStatus = order.payment?.paymentStatus || '';
            const paymentMethod = order.payment?.paymentMethod || '';
            const createdAt = order.order?.createdAt ? new Date(order.order.createdAt) : null;

            const searchValue = searchText.toLowerCase();
            const nameEmailMatch = name.toLowerCase().includes(searchValue) ||
                email.toLowerCase().includes(searchValue);

            const shippingStatusMatch = !shippingStatusFilter || shippingStatus === shippingStatusFilter;
            const paymentStatusMatch = !paymentStatusFilter || paymentStatus === paymentStatusFilter;
            const paymentMethodMatch = !paymentMethodFilter || paymentMethod === paymentMethodFilter;

            // Kiểm tra lọc theo khoảng thời gian
            let dateRangeMatch = true;
            if (dateRange && dateRange[0] && dateRange[1] && createdAt) {
                const startDate = dateRange[0].startOf('day').toDate();
                const endDate = dateRange[1].endOf('day').toDate();
                dateRangeMatch = createdAt >= startDate && createdAt <= endDate;
            }

            return nameEmailMatch && shippingStatusMatch && paymentStatusMatch && paymentMethodMatch && dateRangeMatch;
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
                    {(currentPage - 1) * pageSize + index + 1}
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
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            onClick={() => handleViewOrderDetail(record)}
                            icon={<EyeOutlined />}
                            shape="circle"
                            className="bg-green-500 hover:bg-green-600"
                        />
                    </Tooltip>
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

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

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

            <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Text strong>Trạng thái vận chuyển:</Text>
                    <Select
                        placeholder="Tất cả"
                        style={{ width: 150 }}
                        value={shippingStatusFilter || undefined}
                        onChange={(value) => setShippingStatusFilter(value)}
                        allowClear
                    >
                        <Select.Option value="Pending">Chờ xử lý</Select.Option>
                        <Select.Option value="Processing">Đang xử lý</Select.Option>
                        <Select.Option value="Shipping">Đang giao</Select.Option>
                        <Select.Option value="Completed">Hoàn thành</Select.Option>
                        <Select.Option value="Cancelled">Đã hủy</Select.Option>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Text strong>Trạng thái thanh toán:</Text>
                    <Select
                        placeholder="Tất cả"
                        style={{ width: 180 }}
                        value={paymentStatusFilter || undefined}
                        onChange={(value) => setPaymentStatusFilter(value)}
                        allowClear
                    >
                        <Select.Option value="Pending">Chưa thanh toán</Select.Option>
                        <Select.Option value="Completed">Đã thanh toán</Select.Option>
                        <Select.Option value="Expired">Hết hạn thanh toán</Select.Option>
                        <Select.Option value="Refund_Pending">Đang chờ hoàn tiền</Select.Option>
                        <Select.Option value="Refunded">Đã hoàn tiền</Select.Option>
                        <Select.Option value="Refund_Failed">Hoàn tiền thất bại</Select.Option>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Text strong>Phương thức thanh toán:</Text>
                    <Select
                        placeholder="Tất cả"
                        style={{ width: 120 }}
                        value={paymentMethodFilter || undefined}
                        onChange={(value) => setPaymentMethodFilter(value)}
                        allowClear
                    >
                        <Select.Option value="COD">COD</Select.Option>
                        <Select.Option value="VNPay">VNPay</Select.Option>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Text strong>Thời gian đặt hàng:</Text>
                    <RangePicker
                        format="DD/MM/YYYY"
                        onChange={handleDateRangeChange}
                        value={dateRange}
                        allowClear
                        placeholder={['Từ ngày', 'Đến ngày']}
                        style={{ width: 280 }}
                    />
                </div>

                {(shippingStatusFilter || paymentStatusFilter || paymentMethodFilter || dateRange) && (
                    <Button
                        type="link"
                        onClick={handleClearFilters}
                        className="text-blue-500"
                    >
                        Xóa bộ lọc
                    </Button>
                )}
            </div>

            <Divider className="my-4" />

            <Table
                columns={columns}
                dataSource={filteredOrders}
                loading={isPendingGetAll}
                rowKey={(record) => record.order?._id}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50', '100'],
                    showTotal: (total) => `Tổng cộng ${total} đơn hàng`,
                }}
                onChange={handleTableChange}
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

            {/* Modal for order details */}
            <Modal
                title={<Text strong>Chi tiết đơn hàng</Text>}
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsDetailModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
                centered
            >
                {orderDetail && orderDetail.data && (
                    <div className="space-y-6">
                        <Descriptions title="Thông tin đơn hàng" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Mã đơn hàng">{orderDetail.data.order._id}</Descriptions.Item>
                            <Descriptions.Item label="Ngày đặt hàng">
                                {dayjs(orderDetail.data.order.createdAt).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái vận chuyển">
                                <Tag color={
                                    orderDetail.data.order.shippingStatus === "Pending" ? "orange" :
                                        orderDetail.data.order.shippingStatus === "Processing" ? "purple" :
                                            orderDetail.data.order.shippingStatus === "Shipping" ? "blue" :
                                                orderDetail.data.order.shippingStatus === "Completed" ? "green" :
                                                    orderDetail.data.order.shippingStatus === "Cancelled" ? "red" : "default"
                                }>
                                    {orderDetail.data.order.shippingStatus === "Pending" ? "Chờ xử lý" :
                                        orderDetail.data.order.shippingStatus === "Processing" ? "Đang xử lý" :
                                            orderDetail.data.order.shippingStatus === "Shipping" ? "Đang giao" :
                                                orderDetail.data.order.shippingStatus === "Completed" ? "Hoàn thành" :
                                                    orderDetail.data.order.shippingStatus === "Cancelled" ? "Đã hủy" : "Không xác định"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái thanh toán">
                                <Tag color={
                                    orderDetail.data.payment?.paymentStatus === "Pending" ? "orange" :
                                        orderDetail.data.payment?.paymentStatus === "Completed" ? "green" :
                                            orderDetail.data.payment?.paymentStatus === "Expired" ? "red" :
                                                orderDetail.data.payment?.paymentStatus === "Refund_Pending" ? "blue" :
                                                    orderDetail.data.payment?.paymentStatus === "Refunded" ? "cyan" :
                                                        orderDetail.data.payment?.paymentStatus === "Refund_Failed" ? "red" : "default"
                                }>
                                    {orderDetail.data.payment?.paymentStatus === "Pending" ? "Chưa thanh toán" :
                                        orderDetail.data.payment?.paymentStatus === "Completed" ? "Đã thanh toán" :
                                            orderDetail.data.payment?.paymentStatus === "Expired" ? "Hết hạn thanh toán" :
                                                orderDetail.data.payment?.paymentStatus === "Refund_Pending" ? "Đang chờ hoàn tiền" :
                                                    orderDetail.data.payment?.paymentStatus === "Refunded" ? "Đã hoàn tiền" :
                                                        orderDetail.data.payment?.paymentStatus === "Refund_Failed" ? "Hoàn tiền thất bại" : "Không xác định"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phương thức thanh toán">{orderDetail.data.payment?.paymentMethod}</Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                                <Text className="text-red-600 font-bold">
                                    {new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                    }).format(orderDetail.data.order.totalPrice)}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <Descriptions title="Thông tin người nhận" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Họ tên">{orderDetail.data.order.shippingInfo.name}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">{orderDetail.data.order.shippingInfo.phoneNumber}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ" span={2}>
                                {orderDetail.data.order.shippingInfo.detailedAddress &&
                                    `${orderDetail.data.order.shippingInfo.detailedAddress}, ${orderDetail.data.order.shippingInfo.ward}, ${orderDetail.data.order.shippingInfo.district}, ${orderDetail.data.order.shippingInfo.city}`}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div>
                            <Title level={5}>Danh sách sản phẩm</Title>
                            <List
                                itemLayout="horizontal"
                                dataSource={orderDetail.data.order.products}
                                renderItem={(item) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar shape="square" size={64} src={item.product.imageUrl?.[0]} />
                                            }
                                            title={<Text strong>{item.product.name}</Text>}
                                            description={
                                                <Space direction="vertical">
                                                    <Text>Số lượng: {item.quantity}</Text>
                                                    <Text>Đơn giá: {new Intl.NumberFormat("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                    }).format(item.price)}</Text>
                                                    {item.isFlashSale && (
                                                        <Tag color="volcano">Flash Sale</Tag>
                                                    )}
                                                </Space>
                                            }
                                        />
                                        <div className="text-right">
                                            <Text className="text-red-500 font-bold">
                                                {new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: "VND",
                                                }).format(item.price * item.quantity)}
                                            </Text>
                                        </div>
                                    </List.Item>
                                )}
                            />

                            <div className="mt-4 bg-gray-50 p-4 rounded-md">
                                <div className="flex justify-between items-center">
                                    <Text>Tạm tính:</Text>
                                    <Text>
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(orderDetail.data.order.subTotal)}
                                    </Text>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <Text>Phí vận chuyển:</Text>
                                    <Text>
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(orderDetail.data.order.shippingPrice)}
                                    </Text>
                                </div>
                                <Divider className="my-2" />
                                <div className="flex justify-between items-center">
                                    <Text strong>Tổng cộng:</Text>
                                    <Text className="text-red-600 font-bold text-lg">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(orderDetail.data.order.totalPrice)}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default Orders;
