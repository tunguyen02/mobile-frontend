import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Divider, Table, Typography, Result, Button, Tag, Spin } from "antd";
import { formatCurrency, timeTranformFromMongoDB } from "../../utils/utils";
import { ThunderboltOutlined } from "@ant-design/icons";
const { Title } = Typography;

function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = React.useState(true);
    const [orderData, setOrderData] = React.useState(null);
    const [paymentData, setPaymentData] = React.useState(null);
    const [hasError, setHasError] = React.useState(false);

    useEffect(() => {
        // Đảm bảo có thời gian kiểm tra dữ liệu
        try {
            const state = location.state || {};
            if (state.order && state.payment) {
                setOrderData(state.order);
                setPaymentData(state.payment);
                setLoading(false);
            } else {
                setHasError(true);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error loading order data:", error);
            setHasError(true);
            setLoading(false);
        }
    }, [location]);

    const handleProductDetails = (productId) => {
        navigate(`/product/product-details/${productId}`);
    }

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
            render: (text, record) => <div className="font-bold text-base">{formatCurrency(record?.price || 0)}<sup>₫</sup></div>,
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
                    subTitle="Có thể bạn đã truy cập trực tiếp vào trang này hoặc đã xảy ra lỗi trong quá trình xử lý đơn hàng."
                    extra={[
                        <Button type="primary" key="console" onClick={() => navigate("/")}>
                            Về trang chủ
                        </Button>,
                        <Button key="buy" onClick={() => navigate("/cart")}>
                            Đến giỏ hàng
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 py-14 px-8 md:px-48 text-base">
            <div className="bg-white rounded-md py-8 text-black">
                <div className="flex justify-center">
                    <Title level={2}>Đơn hàng đã được đặt thành công</Title>
                </div>
                <div className="px-4 md:px-16 py-3 flex flex-col md:flex-row md:justify-between">
                    <div className="text-lg mb-2 md:mb-0">
                        <strong>Thời gian đặt hàng:</strong> {orderData?.createdAt ? timeTranformFromMongoDB(orderData.createdAt) : ""}
                    </div>
                    {paymentData?.paymentStatus === "Completed" ? (
                        <div className="text-lg px-2 py-1 bg-green-400 w-fit rounded-lg font-bold text-white h-fit">
                            Đã thanh toán
                        </div>
                    ) : (
                        <div className="text-lg px-2 py-1 bg-yellow-500 w-fit rounded-lg font-bold text-white h-fit">
                            Chưa thanh toán
                        </div>
                    )}
                </div>
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
                    <div className="text-lg p-2 bg-blue-500 w-fit rounded-lg font-bold text-white">
                        {paymentData?.paymentMethod || ""}
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
            </div>
        </div>
    );
}

export default OrderSuccess;
