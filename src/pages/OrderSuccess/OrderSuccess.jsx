import React, { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Divider, Table, Typography, Result, Button, Tag, Spin, Alert, Space, Card } from "antd";
import { formatCurrency, timeTranformFromMongoDB } from "../../utils/utils";
import { ThunderboltOutlined, CheckCircleOutlined, DollarOutlined, ClockCircleOutlined, HomeOutlined, ShoppingCartOutlined, InfoCircleOutlined } from "@ant-design/icons";
import orderService from "../../services/orderService";
const { Title, Text } = Typography;

function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = React.useState(true);
    const [orderData, setOrderData] = React.useState(null);
    const [paymentData, setPaymentData] = React.useState(null);
    const [hasError, setHasError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");
    const [vnpayResponse, setVnpayResponse] = React.useState(null);

    useEffect(() => {
        // Lưu trữ thông tin VNPay response nếu có
        const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
        const vnp_TxnRef = searchParams.get('vnp_TxnRef');
        const vnp_Amount = searchParams.get('vnp_Amount');
        const vnp_OrderInfo = searchParams.get('vnp_OrderInfo');
        const vnp_TransactionNo = searchParams.get('vnp_TransactionNo');

        if (vnp_ResponseCode || vnp_TxnRef) {
            setVnpayResponse({
                responseCode: vnp_ResponseCode,
                txnRef: vnp_TxnRef,
                amount: vnp_Amount ? parseInt(vnp_Amount) / 100 : null,
                orderInfo: vnp_OrderInfo,
                transactionNo: vnp_TransactionNo
            });
        }

        const fetchOrderFromParams = async () => {
            try {
                // Kiểm tra xem có orderId từ query param không (chuyển hướng từ VNPay)
                let orderId = searchParams.get('orderId');

                // Cố gắng trích xuất orderId từ vnp_TxnRef nếu có
                if (!orderId && vnp_TxnRef) {
                    const txnRefParts = vnp_TxnRef.split('_');
                    if (txnRefParts.length > 0) {
                        orderId = txnRefParts[0];
                        console.log("Extracted orderId from vnp_TxnRef:", orderId);
                    }
                }

                console.log("URL params:", Object.fromEntries(searchParams.entries()));
                console.log("Attempting to fetch order with ID:", orderId);

                if (orderId) {
                    console.log("Fetching order details for orderId:", orderId);
                    const result = await orderService.getOrderById(orderId);
                    console.log("API response:", result);

                    if (result.status === 'OK' && result.data) {
                        console.log("Order details retrieved:", result.data);
                        setOrderData(result.data.order);
                        setPaymentData(result.data.payment);
                        setLoading(false);
                    } else {
                        console.error("Failed to retrieve order details:", result);
                        setErrorMessage(result.message || "Không thể tải thông tin đơn hàng");
                        setHasError(true);
                        setLoading(false);
                    }
                } else {
                    // Nếu không có orderId, sử dụng dữ liệu từ state (cách cũ)
                    const state = location.state || {};
                    console.log("Using state data:", state);

                    if (state.order && state.payment) {
                        setOrderData(state.order);
                        setPaymentData(state.payment);
                        setLoading(false);
                    } else if (state.newOrder && state.payment) {
                        // Trường hợp data được truyền theo cấu trúc khác
                        setOrderData(state.newOrder);
                        setPaymentData(state.payment);
                        setLoading(false);
                    } else {
                        console.error("No order data found in state:", state);
                        setErrorMessage("Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra trong trang đơn hàng của bạn.");
                        setHasError(true);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error("Error loading order data:", error);
                setErrorMessage(error.message || "Đã xảy ra lỗi khi tải thông tin đơn hàng");
                setHasError(true);
                setLoading(false);
            }
        };

        fetchOrderFromParams();
    }, [location, searchParams]);

    const handleProductDetails = (productId) => {
        navigate(`/product/product-details/${productId}`);
    }

    const getPaymentStatusMessage = () => {
        if (!paymentData) {
            // Nếu không có dữ liệu thanh toán nhưng có thông tin từ VNPay
            if (vnpayResponse && vnpayResponse.responseCode === '00') {
                return (
                    <Alert
                        message="Thanh toán thành công qua VNPay"
                        description="Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý."
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                    />
                );
            }
            return null;
        }

        if (paymentData.paymentMethod === 'VNPay') {
            return paymentData.paymentStatus === "Completed" ?
                <Alert
                    message="Thanh toán thành công qua VNPay"
                    description="Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý."
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                /> :
                <Alert
                    message="Đơn hàng chưa được thanh toán"
                    description="Bạn vẫn có thể thanh toán trong trang chi tiết đơn hàng."
                    type="warning"
                    showIcon
                />;
        } else if (paymentData.paymentMethod === 'COD') {
            return <Alert
                message="Đơn hàng thanh toán khi nhận hàng (COD)"
                description="Bạn sẽ thanh toán khi nhận được hàng. Cảm ơn bạn đã đặt hàng."
                type="info"
                showIcon
                icon={<DollarOutlined />}
            />;
        }

        return null;
    };

    const columns = [
        {
            title: "Sản phẩm",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <div className="flex items-center">
                    <img
                        src={record.product?.imageUrl?.[0] || ''}
                        alt={record.product?.name || ''}
                        style={{ width: 100, height: 100, marginRight: 10, cursor: 'pointer' }}
                        onClick={() => handleProductDetails(record?.product?._id)}
                    />
                    <div>
                        <div className="text-base hover:text-sky-500 cursor-pointer" onClick={() => handleProductDetails(record?.product?._id)}>{record.product?.name || ''}</div>
                        <div className="text-gray-500">{record.product?.color || ''}</div>
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
            render: (text, record) => <div className="text-base">{record?.quantity || 0}</div>,
        },
        {
            title: "Tạm tính",
            dataIndex: "total",
            key: "total",
            render: (text, record) => <div className="text-red-600 font-bold text-base">{formatCurrency((record?.price || 0) * (record?.quantity || 0))}<sup>₫</sup></div>,
        },
    ];

    if (loading) {
        return (
            <div className="bg-gray-100 py-14 px-8 md:px-48 min-h-screen flex items-center justify-center">
                <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="bg-gray-100 py-14 px-8 md:px-48 min-h-screen flex items-center justify-center">
                <Result
                    status="error"
                    title="Không thể hiển thị thông tin đơn hàng"
                    subTitle={
                        <div>
                            <p>{errorMessage || "Có thể bạn đã truy cập trực tiếp vào trang này hoặc đã xảy ra lỗi trong quá trình xử lý đơn hàng."}</p>
                            {vnpayResponse && (
                                <Card title="Thông tin thanh toán VNPay" className="mt-4">
                                    <p>Mã đơn hàng: {vnpayResponse.txnRef}</p>
                                    {vnpayResponse.amount && <p>Số tiền: {formatCurrency(vnpayResponse.amount)}<sup>₫</sup></p>}
                                    {vnpayResponse.orderInfo && <p>Thông tin: {vnpayResponse.orderInfo}</p>}
                                    <p>Trạng thái: {vnpayResponse.responseCode === '00' ? 'Thành công' : 'Thất bại'}</p>
                                </Card>
                            )}
                        </div>
                    }
                    extra={[
                        <Button type="primary" key="home" icon={<HomeOutlined />} onClick={() => navigate("/")}>
                            Về trang chủ
                        </Button>,
                        <Button key="orders" icon={<InfoCircleOutlined />} onClick={() => navigate("/user/purchase")}>
                            Đơn hàng của tôi
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 py-14 px-8 md:px-48 text-base">
            <div className="bg-white rounded-md py-8 text-black">
                <div className="flex justify-center mb-4">
                    <Result
                        status="success"
                        title="Đơn hàng đã được đặt thành công!"
                        subTitle={`Mã đơn hàng: #${orderData?._id || (vnpayResponse?.txnRef?.split('_')[0] || "")}`}
                    />
                </div>

                <div className="px-4 md:px-16 mb-4">
                    {getPaymentStatusMessage()}

                    {vnpayResponse && vnpayResponse.responseCode === '00' && (
                        <div className="mt-4">
                            <Alert
                                type="info"
                                message="Thông tin thanh toán VNPay"
                                description={
                                    <div>
                                        <p>Mã giao dịch: {vnpayResponse.transactionNo}</p>
                                        {vnpayResponse.amount && <p>Số tiền đã thanh toán: {formatCurrency(vnpayResponse.amount)}<sup>₫</sup></p>}
                                    </div>
                                }
                                showIcon
                            />
                        </div>
                    )}
                </div>

                <Divider />
                <div className="px-4 md:px-16 py-3 flex flex-col md:flex-row md:justify-between">
                    <div className="text-lg mb-2 md:mb-0">
                        <div><strong>Thời gian đặt hàng:</strong> {orderData?.createdAt ? timeTranformFromMongoDB(orderData.createdAt) : ""}</div>
                        <div><strong>Trạng thái đơn hàng:</strong> {orderData?.shippingStatus === "Completed" ? "Đã giao" : orderData?.shippingStatus === "Shipping" ? "Đang vận chuyển" : orderData?.shippingStatus === "Cancelled" ? "Đã hủy" : "Đang chờ xử lý"}</div>
                    </div>
                    <Space direction="vertical">
                        {paymentData?.paymentStatus === "Completed" || (vnpayResponse && vnpayResponse.responseCode === '00') ? (
                            <div className="text-lg px-2 py-1 bg-green-400 w-fit rounded-lg font-bold text-white">
                                <CheckCircleOutlined /> Đã thanh toán
                            </div>
                        ) : paymentData?.paymentStatus === "Expired" ? (
                            <div className="text-lg px-2 py-1 bg-red-500 w-fit rounded-lg font-bold text-white">
                                <ClockCircleOutlined /> Hết hạn thanh toán
                            </div>
                        ) : (
                            <div className="text-lg px-2 py-1 bg-yellow-500 w-fit rounded-lg font-bold text-white">
                                <ClockCircleOutlined /> Chưa thanh toán
                            </div>
                        )}
                        {orderData?._id && (
                            <Button
                                type="primary"
                                onClick={() => navigate(`/order/details/${orderData?._id}`)}
                            >
                                Xem chi tiết đơn hàng
                            </Button>
                        )}
                    </Space>
                </div>

                {orderData && (
                    <>
                        <Divider />
                        <div className="px-4 md:px-16 py-3">
                            <div className="text-lg font-bold mb-2">Thông tin nhận hàng</div>
                            <div>Người nhận: {orderData?.shippingInfo?.name || ""}</div>
                            <div>Số điện thoại: {orderData?.shippingInfo?.phoneNumber || ""}</div>
                            <div>
                                {orderData?.shippingInfo ?
                                    `Địa chỉ: ${orderData.shippingInfo.detailedAddress || ""}, ${orderData.shippingInfo.ward || ""}, ${orderData.shippingInfo.district || ""}, ${orderData.shippingInfo.city || ""}`
                                    : ""}
                            </div>
                        </div>
                        <Divider />
                        <div className="px-4 md:px-16 py-3">
                            <div className="text-lg font-bold mb-2">Phương thức thanh toán</div>
                            <div className="flex items-center gap-3">
                                <div className="text-lg p-2 bg-blue-500 w-fit rounded-lg font-bold text-white">
                                    {paymentData?.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : "VNPay"}
                                </div>
                            </div>
                        </div>
                        <Divider />
                        <div className="px-4 md:px-16 py-3">
                            <div className="text-lg font-bold mb-2">Đơn hàng</div>
                            <Table
                                dataSource={orderData?.products || []}
                                columns={columns}
                                pagination={false}
                                scroll={{ x: true }}
                            />
                        </div>
                        <div className="px-4 md:px-16 py-3 mt-8 flex justify-end">
                            <div className="flex flex-col gap-1">
                                <div>
                                    <span className="text-lg">Tạm tính: </span>
                                    <span className="font-bold text-lg">{formatCurrency(orderData?.subTotal || 0)}<sup>₫</sup></span>
                                </div>
                                <div>
                                    <span className="text-lg">Phí vận chuyển: </span>
                                    <span className="font-bold text-lg">{formatCurrency(orderData?.shippingPrice || 0)}<sup>₫</sup></span>
                                </div>
                                <div>
                                    <span className="text-lg">Tổng tiền: </span>
                                    <span className="font-bold text-xl text-red-600">{formatCurrency(orderData?.totalPrice || 0)}<sup>₫</sup></span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="px-4 md:px-16 py-3 mt-4 flex justify-center">
                    <Space>
                        <Button
                            type="primary"
                            icon={<HomeOutlined />}
                            size="large"
                            onClick={() => navigate("/")}
                        >
                            Tiếp tục mua sắm
                        </Button>
                        <Button
                            icon={<ShoppingCartOutlined />}
                            size="large"
                            onClick={() => navigate("/user/purchase")}
                        >
                            Xem đơn hàng của tôi
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    );
}

export default OrderSuccess;
