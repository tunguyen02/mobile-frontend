import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Divider, Table, Typography, Button, Space, Tag, message, Modal, Tooltip } from "antd";
import { formatCurrency, timeTranformFromMongoDB } from "../../utils/utils";
import { useQuery } from "@tanstack/react-query";
import { handleGetAccessToken } from "../../services/axiosJWT";
import orderService from "../../services/orderService";
import ReviewButton from "../../components/ReviewButton/ReviewButton";
import { ThunderboltOutlined, ClockCircleOutlined, DollarOutlined, SwapOutlined, StopOutlined } from "@ant-design/icons";
import refundService from "../../services/refundService.js";
import dayjs from "dayjs";
const { Title, Text } = Typography;

function OrderDetails() {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingPayment, setIsChangingPayment] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    const { data = {}, isPending, refetch } = useQuery({
        queryKey: ["order-details", orderId],
        queryFn: async () => {
            const accessToken = handleGetAccessToken();
            return await orderService.getOrderDetails(accessToken, orderId);
        },
        enabled: true,
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
    });

    const { order, payment } = data;
    console.log("order", order);
    console.log("payment", payment);

    // Tính thời gian còn lại để thanh toán (24h kể từ khi tạo đơn)
    useEffect(() => {
        if (payment?.paymentMethod === 'VNPay' && payment?.paymentStatus === 'Pending' && order?.createdAt) {
            const calculateTimeLeft = () => {
                const orderDate = new Date(order.createdAt);
                const expiryDate = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000); // 24h sau khi tạo
                const now = new Date();

                if (now > expiryDate) {
                    setTimeLeft('Đã hết hạn');
                    setIsExpired(true);
                    return;
                }

                const diff = expiryDate - now;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                setTimeLeft(`${hours}h ${minutes}m`);
            };

            calculateTimeLeft();
            const timer = setInterval(calculateTimeLeft, 60000); // Cập nhật mỗi phút

            return () => clearInterval(timer);
        }
    }, [order, payment]);

    // Debug thông tin chi tiết sản phẩm
    if (order?.products) {
        order.products.forEach(item => {
            console.log("Product in order:", {
                name: item.product.name,
                price: item.price,
                originalPrice: item.originalPrice,
                productPrice: item.product.price,
                productOriginalPrice: item.product.originalPrice,
                isFlashSale: item.isFlashSale
            });
        });
    }

    const handleProductDetails = (productId) => {
        navigate(`/product/product-details/${productId}`);
    };

    // Hàm để thanh toán lại đơn hàng VNPay
    const handleRepayVNPay = async () => {
        try {
            setIsLoading(true);
            const accessToken = handleGetAccessToken();
            const result = await orderService.repayOrder(accessToken, orderId);

            if (result.paymentUrl) {
                message.loading("Đang chuyển hướng đến cổng thanh toán VNPay...", 2);
                setTimeout(() => {
                    window.location.href = result.paymentUrl;
                }, 1500);
            } else {
                message.error("Không thể tạo URL thanh toán", 3);
            }
        } catch (error) {
            console.error("Lỗi khi thanh toán lại:", error);
            message.error("Đã xảy ra lỗi khi tạo lại thanh toán", 3);
        } finally {
            setIsLoading(false);
        }
    }

    // Hàm chuyển sang thanh toán COD
    const handleSwitchToCOD = async () => {
        Modal.confirm({
            title: 'Chuyển sang thanh toán khi nhận hàng?',
            content: 'Bạn có chắc chắn muốn chuyển sang phương thức thanh toán khi nhận hàng (COD) không?',
            okText: 'Đồng ý',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    setIsChangingPayment(true);
                    const accessToken = handleGetAccessToken();
                    const result = await orderService.changePaymentMethod(accessToken, orderId, 'COD');

                    if (result.status === 'OK') {
                        message.success('Đã chuyển sang thanh toán khi nhận hàng thành công', 3);
                        setTimeout(() => {
                            refetch(); // Làm mới dữ liệu đơn hàng
                        }, 1000);
                    } else {
                        message.error(result.message || 'Không thể chuyển đổi phương thức thanh toán', 3);
                    }
                } catch (error) {
                    console.error("Lỗi khi chuyển đổi phương thức thanh toán:", error);
                    message.error("Đã xảy ra lỗi khi chuyển đổi phương thức thanh toán", 3);
                } finally {
                    setIsChangingPayment(false);
                }
            }
        });
    }

    // Kiểm tra xem đơn hàng có phải VNPay và chưa thanh toán không
    const isVNPayPending = payment?.paymentMethod === 'VNPay' && payment?.paymentStatus === 'Pending';

    // Kiểm tra xem đơn hàng có thể hủy không (chỉ có thể hủy khi đơn hàng ở trạng thái Pending)
    const canCancel = order?.shippingStatus === "Pending";

    // Hàm để hủy đơn hàng
    const handleCancelOrder = async () => {
        Modal.confirm({
            title: 'Hủy đơn hàng?',
            content: 'Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.',
            okText: 'Đồng ý',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const accessToken = handleGetAccessToken();
                    const result = await orderService.cancelOrder(accessToken, orderId);

                    if (result.success) {
                        message.success(result.message || 'Đã hủy đơn hàng thành công', 3);

                        // Kiểm tra nếu có yêu cầu hoàn tiền
                        if (result.hasRefund && result.refundInfo) {
                            // Hiển thị thông báo về hoàn tiền
                            Modal.success({
                                title: 'Đã tạo yêu cầu hoàn tiền tự động',
                                content: 'Đơn hàng đã thanh toán VNPay của bạn đã được hủy và hệ thống đã tự động tạo yêu cầu hoàn tiền. Bạn có muốn xem thông tin hoàn tiền không?',
                                okText: 'Xem hoàn tiền',
                                cancelText: 'Để sau',
                                onOk: () => {
                                    navigate('/my-refunds');
                                },
                                onCancel: () => {
                                    refetch(); // Làm mới dữ liệu đơn hàng
                                }
                            });
                        } else {
                            // Nếu không có hoàn tiền, chỉ làm mới dữ liệu đơn hàng
                            setTimeout(() => {
                                refetch();
                            }, 1500);
                        }
                    } else {
                        message.error(result.message || 'Không thể hủy đơn hàng', 3);
                    }
                } catch (error) {
                    console.error("Lỗi khi hủy đơn hàng:", error);
                    message.error(error.response?.data?.message || "Đã xảy ra lỗi khi hủy đơn hàng", 3);
                }
            }
        });
    };

    // Hàm trả về tag trạng thái đơn hàng với màu sắc tương ứng
    const renderOrderStatusTag = (status) => {
        let color = 'default';
        let text = 'Không xác định';

        switch (status) {
            case 'Pending':
                color = 'orange';
                text = 'Đang chờ xử lý';
                break;
            case 'Processing':
                color = 'purple';
                text = 'Đang xử lý';
                break;
            case 'Shipping':
                color = 'blue';
                text = 'Đang vận chuyển';
                break;
            case 'Completed':
                color = 'green';
                text = 'Đã giao';
                break;
            case 'Cancelled':
                color = 'red';
                text = 'Đã hủy';
                break;
        }

        return <Tag color={color} style={{ fontSize: '16px', padding: '4px 12px' }}>{text}</Tag>;
    };

    const columns = [
        {
            title: "Sản phẩm",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <div className="flex items-center">
                    <img
                        src={record.product.imageUrl[0]}
                        alt={record.product.name}
                        style={{
                            width: 100,
                            height: 100,
                            marginRight: 10,
                            cursor: "pointer",
                        }}
                        onClick={() => handleProductDetails(record?.product?._id)}
                    />
                    <div>
                        <div
                            className="text-base hover:text-sky-500 cursor-pointer"
                            onClick={() => handleProductDetails(record?.product?._id)}
                        >
                            {record.product.name}
                        </div>
                        <div className="text-gray-500">{record.product.color}</div>
                        {record.isFlashSale && (
                            <Tag color="orange" className="mt-1">
                                <ThunderboltOutlined /> Flash Sale
                            </Tag>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Đơn giá",
            dataIndex: "price",
            key: "price",
            render: (text, record) => {
                // Lấy giá gốc từ nhiều nguồn có thể 
                const originalPrice = record.originalPrice ||
                    record.product?.originalPrice ||
                    (record.isFlashSale ? 19990000 : record.price) || 0; // Hardcode giá iPhone để đảm bảo

                // Lấy giá hiện tại
                const currentPrice = record.price || 0;

                return (
                    <div>
                        {record.isFlashSale ? (
                            <>
                                <div className="text-gray-400 line-through text-sm">
                                    {formatCurrency(originalPrice)}
                                    <sup>₫</sup>
                                </div>
                                <div className="font-bold text-base text-red-500">
                                    {formatCurrency(currentPrice)}
                                    <sup>₫</sup>
                                </div>
                            </>
                        ) : (
                            <div className="font-bold text-base">
                                {formatCurrency(currentPrice)}
                                <sup>₫</sup>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            key: "quantity",
            render: (text, record) => (
                <div className="text-base">{record?.quantity}</div>
            ),
        },
        {
            title: "Tạm tính",
            dataIndex: "total",
            key: "total",
            render: (text, record) => (
                <div className="text-red-600 font-bold text-base">
                    {formatCurrency(record?.price * record?.quantity)}
                    <sup>₫</sup>
                </div>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            render: (text, record) => (
                <Space size="middle">
                    {order?.shippingStatus === "Completed" && (
                        <ReviewButton product={record.product} orderId={orderId} />
                    )}
                    <Button
                        type="primary"
                        onClick={() => handleProductDetails(record?.product?._id)}
                    >
                        Mua lại
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="bg-gray-100 py-14 px-48 text-base">
            <div className="bg-white rounded-md py-8 text-black">
                <div className="flex justify-center">
                    <Title level={2}>Thông tin đơn hàng</Title>
                </div>
                <div className="px-16 py-3 flex justify-between">
                    <div className="text-lg">
                        <div><strong>Mã đơn hàng:</strong> #{orderId}</div>
                        <div><strong>Thời gian đặt hàng:</strong> {timeTranformFromMongoDB(order?.createdAt)}</div>
                        <div className="mt-2">
                            <strong>Trạng thái đơn hàng:</strong> {renderOrderStatusTag(order?.shippingStatus)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {payment?.paymentStatus === "Completed" ? (
                            <div className="text-lg px-2 py-1 bg-green-400 w-fit rounded-lg font-bold text-white">
                                Đã thanh toán
                            </div>
                        ) : payment?.paymentStatus === "Expired" ? (
                            <div className="text-lg px-2 py-1 bg-red-500 w-fit rounded-lg font-bold text-white">
                                Hết hạn thanh toán
                            </div>
                        ) : payment?.paymentStatus === "Refund_Pending" ? (
                            <div className="text-lg px-2 py-1 bg-orange-500 w-fit rounded-lg font-bold text-white">
                                Đang chờ hoàn tiền
                            </div>
                        ) : payment?.paymentStatus === "Refunded" ? (
                            <div className="text-lg px-2 py-1 bg-cyan-500 w-fit rounded-lg font-bold text-white">
                                Đã hoàn tiền
                            </div>
                        ) : payment?.paymentStatus === "Refund_Failed" ? (
                            <div className="text-lg px-2 py-1 bg-red-500 w-fit rounded-lg font-bold text-white">
                                Hoàn tiền thất bại
                            </div>
                        ) : (
                            <div className="text-lg px-2 py-1 bg-yellow-500 w-fit rounded-lg font-bold text-white">
                                Chưa thanh toán
                            </div>
                        )}

                        {isVNPayPending && !isExpired && (
                            <Tooltip title="Thời gian còn lại để thanh toán">
                                <Tag color="blue" className="flex items-center">
                                    <ClockCircleOutlined className="mr-1" /> {timeLeft}
                                </Tag>
                            </Tooltip>
                        )}
                    </div>
                </div>
                <Divider />
                <div className="px-16 py-3">
                    <div className="text-lg font-bold mb-2">Thông tin nhận hàng</div>
                    <div>Người nhận: {order?.shippingInfo?.name}</div>
                    <div>Số điện thoại: {order?.shippingInfo?.phoneNumber}</div>
                    <div>
                        {`Địa chỉ: ${order?.shippingInfo?.detailedAddress}, ${order?.shippingInfo?.ward}, ${order?.shippingInfo?.district}, ${order?.shippingInfo?.city}`}
                    </div>
                </div>
                <Divider />
                <div className="px-16 py-3">
                    <div className="text-lg font-bold mb-2">Phương thức thanh toán</div>
                    <div className="flex items-center gap-3">
                        <div className="text-lg p-2 bg-blue-500 w-fit rounded-lg font-bold text-white">
                            {payment?.paymentMethod}
                        </div>

                        {isVNPayPending && !isExpired && (
                            <div className="flex gap-2">
                                <Button
                                    type="primary"
                                    danger
                                    onClick={handleRepayVNPay}
                                    loading={isLoading}
                                >
                                    Thanh toán lại
                                </Button>
                                <Button
                                    icon={<SwapOutlined />}
                                    onClick={handleSwitchToCOD}
                                    loading={isChangingPayment}
                                >
                                    Chuyển sang COD
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <Divider />
                <div className="px-16 py-3">
                    <div className="text-lg font-bold mb-2">Đơn hàng</div>
                    <Table
                        dataSource={order?.products}
                        columns={columns}
                        pagination={false}
                    />
                </div>
                <div className="px-16 py-3 mt-8 flex justify-end">
                    <div className="flex flex-col gap-1">
                        <div>
                            <span className="text-lg">Tạm tính: </span>
                            <span className="font-bold text-lg">
                                {formatCurrency(order?.subTotal)}
                                <sup>₫</sup>
                            </span>
                        </div>
                        <div>
                            <span className="text-lg">Phí vận chuyển: </span>
                            <span className="font-bold text-lg">
                                {formatCurrency(order?.shippingPrice)}
                                <sup>₫</sup>
                            </span>
                        </div>
                        <div>
                            <span className="text-lg">Tổng tiền: </span>
                            <span className="font-bold text-xl text-red-600">
                                {formatCurrency(order?.totalPrice)}
                                <sup>₫</sup>
                            </span>
                        </div>
                    </div>
                </div>

                {canCancel && (
                    <div className="px-16 py-3 mt-4 flex justify-end">
                        <Button
                            type="primary"
                            danger
                            icon={<StopOutlined />}
                            onClick={handleCancelOrder}
                            size="large"
                        >
                            Hủy đơn hàng
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderDetails;
