import { TruckOutlined, DollarOutlined, ClockCircleOutlined, SwapOutlined, StopOutlined } from '@ant-design/icons'
import { Col, Divider, Grid, Row, Button, message, Modal, Tag, Tooltip } from 'antd'
import React, { useState, useEffect } from 'react'
import { formatCurrency } from '../../utils/utils'
import { useNavigate } from 'react-router-dom'
import orderService from '../../services/orderService'
import { handleGetAccessToken } from '../../services/axiosJWT'
import refundService from '../../services/refundService'

function OrderCard({ order }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingPayment, setIsChangingPayment] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    const shippingStatusMap = {
        'Pending': 'Đang chờ xử lý',
        'Processing': 'Đang xử lý',
        'Shipping': 'Đang vận chuyển',
        'Completed': 'Giao hàng thành công',
        'Cancelled': 'Đã hủy'
    }

    // Hàm trả về tag trạng thái đơn hàng với màu sắc tương ứng
    const renderShippingStatusTag = (status) => {
        let color = 'default';

        switch (status) {
            case 'Pending':
                color = 'orange';
                break;
            case 'Processing':
                color = 'purple';
                break;
            case 'Shipping':
                color = 'blue';
                break;
            case 'Completed':
                color = 'green';
                break;
            case 'Cancelled':
                color = 'red';
                break;
        }

        return <Tag color={color}>{shippingStatusMap[status]}</Tag>;
    };

    // Tính thời gian còn lại để thanh toán (24h kể từ khi tạo đơn)
    useEffect(() => {
        if (order?.paymentMethod === 'VNPay' && order?.paymentStatus === 'Pending') {
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
    }, [order]);

    const handleProductDetails = (productId) => {
        navigate(`/product/product-details/${productId}`);
    }

    const handleOrderDetails = (orderId) => {
        navigate(`/order/details/${orderId}`);
    }

    // Hàm để thanh toán lại đơn hàng VNPay
    const handleRepayVNPay = async (orderId) => {
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
    const handleSwitchToCOD = async (orderId) => {
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
                            window.location.reload();
                        }, 1500);
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

    // Hàm để hủy đơn hàng
    const handleCancelOrder = async (orderId) => {
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
                                    window.location.reload();
                                }
                            });
                        } else {
                            // Nếu không có hoàn tiền, chỉ làm mới trang
                            setTimeout(() => {
                                window.location.reload();
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
    }

    // Kiểm tra xem đơn hàng có phải VNPay và chưa thanh toán không
    const isVNPayPending = order?.paymentMethod === 'VNPay' && order?.paymentStatus === 'Pending';

    // Kiểm tra xem đơn hàng có thể hủy không (chỉ có thể hủy khi đơn hàng ở trạng thái Pending)
    const canCancel = order?.shippingStatus === 'Pending';

    return (
        <div className='rounded-lg bg-white px-10 py-8 text-black border border-gray-200 shadow-md'>
            <div className='flex justify-between'>
                <div className='text-gray-500 flex items-center'>
                    <TruckOutlined className="mr-2" /> {renderShippingStatusTag(order?.shippingStatus)}
                </div>
                {isVNPayPending && (
                    <div className='flex items-center gap-2'>
                        <div className='text-yellow-500 font-medium'>
                            <DollarOutlined /> Chưa thanh toán
                        </div>
                        {!isExpired && (
                            <Tooltip title="Thời gian còn lại để thanh toán">
                                <Tag color="blue" className="flex items-center">
                                    <ClockCircleOutlined className="mr-1" /> {timeLeft}
                                </Tag>
                            </Tooltip>
                        )}
                        {isExpired && (
                            <Tag color="red">Đơn hàng đã quá hạn thanh toán</Tag>
                        )}
                    </div>
                )}
                {order?.paymentStatus === "Refund_Pending" && (
                    <div className='flex items-center gap-2'>
                        <Tag color="orange" className="flex items-center">
                            <DollarOutlined className="mr-1" /> Đang chờ hoàn tiền
                        </Tag>
                    </div>
                )}
                {order?.paymentStatus === "Refunded" && (
                    <div className='flex items-center gap-2'>
                        <Tag color="cyan" className="flex items-center">
                            <DollarOutlined className="mr-1" /> Đã hoàn tiền
                        </Tag>
                    </div>
                )}
                {order?.paymentStatus === "Refund_Failed" && (
                    <div className='flex items-center gap-2'>
                        <Tag color="red" className="flex items-center">
                            <DollarOutlined className="mr-1" /> Hoàn tiền thất bại
                        </Tag>
                    </div>
                )}
            </div>
            <Divider />
            {order.products.map(item => (
                <Row key={item?.product?._id} className='mb-4'>
                    <Col span={14} className='flex items-center'>
                        <img className="cursor-pointer" src={item?.product?.imageUrl[0]} alt={item?.product?.name} width='100px' onClick={() => handleProductDetails(item?.product?._id)} />
                        <div className='flex flex-col gap-3'>
                            <div className='text-base text-black hover:text-sky-500 cursor-pointer' onClick={() => { handleProductDetails(item?.product?._id) }}>
                                {item?.product?.name}
                            </div>
                            <div className='text-sm text-zinc-500'>{item?.product?.color}</div>
                        </div>
                    </Col>
                    <Col span={5} className='flex items-center'>
                        <div className='text-base text-black'>{item?.quantity}</div>
                    </Col>
                    <Col span={5} className='flex items-center justify-end'>
                        <div className='text-base text-black'>{formatCurrency(item?.price * item?.quantity)}<sup>₫</sup></div>
                    </Col>
                </Row>
            ))}
            <Divider />
            <div className='flex justify-end gap-2'>
                <span className='font-bold text-black text-lg'>Tổng tiền: </span>
                <span className='font-bold text-red-600 text-lg'>{formatCurrency(order?.totalPrice)}<sup>₫</sup></span>
            </div>
            <div className='flex justify-end mt-3 gap-2'>
                <button className='rounded-md border-sky-500 text-base border text-sky-500 px-2 py-1' onClick={() => { handleOrderDetails(order?._id) }}>Xem chi tiết</button>
                {isVNPayPending && !isExpired && (
                    <>
                        <Button
                            type="primary"
                            danger
                            onClick={() => handleRepayVNPay(order?._id)}
                            loading={isLoading}
                        >
                            Thanh toán lại
                        </Button>
                        <Button
                            icon={<SwapOutlined />}
                            onClick={() => handleSwitchToCOD(order?._id)}
                            loading={isChangingPayment}
                        >
                            Chuyển sang COD
                        </Button>
                    </>
                )}
                {canCancel && (
                    <Button
                        type="primary"
                        danger
                        icon={<StopOutlined />}
                        onClick={() => handleCancelOrder(order?._id)}
                    >
                        Hủy đơn hàng
                    </Button>
                )}
            </div>
        </div>
    )
}

export default OrderCard;