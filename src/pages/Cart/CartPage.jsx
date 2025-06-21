import React, { useEffect, useRef, useState } from "react";
import {
    Select,
    Form,
    Button,
    Input,
    List,
    Row,
    Col,
    Typography,
    InputNumber,
    Radio,
    message,
    Spin,
    Tag,
    Modal,
} from "antd";
import addressVietNam from "../../constants/addressConstants";
import { CloseOutlined, ThunderboltOutlined, LoadingOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import cartService from "../../services/cartService";
import { handleGetAccessToken } from "../../services/axiosJWT";
import { resetCart, setCart } from "../../redux/cartSlice";
import orderService from "../../services/orderService";
import { useNavigate } from "react-router-dom";
import { isFlashSaleValid, updateFlashSaleSoldCount } from "../../utils/utils";
const { Title, Text } = Typography;

const SHIPPING_FEE = 30000;

const CartPage = () => {
    const user = useSelector((state) => state.user);
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [flashSaleProducts, setFlashSaleProducts] = useState({});
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const flashSaleItems = {};

        if (cart?.products) {
            cart.products.forEach(item => {
                const productId = item?.product?._id;
                if (productId) {
                    try {
                        const flashSaleData = localStorage.getItem(`flashSale_${productId}`);
                        if (flashSaleData) {
                            const parsedData = JSON.parse(flashSaleData);

                            if (isFlashSaleValid(parsedData)) {
                                flashSaleItems[productId] = parsedData;
                            } else {
                                localStorage.removeItem(`flashSale_${productId}`);
                            }
                        }
                    } catch (error) {
                        console.error("Lỗi khi đọc thông tin Flash Sale:", error);
                    }
                }
            });
        }

        setFlashSaleProducts(flashSaleItems);
    }, [cart]);

    useEffect(() => {
        if (Object.keys(flashSaleProducts).length > 0 && cart?.products?.length > 0) {
            let needsUpdate = false;
            const updatedProducts = cart.products.map(item => {
                const productId = item?.product?._id;
                if (productId && flashSaleProducts[productId]) {
                    needsUpdate = true;
                    const product = {
                        ...item.product,
                        isFlashSale: true,
                        flashSaleId: flashSaleProducts[productId].flashSaleId
                    };

                    return {
                        ...item,
                        product
                    };
                }
                return item;
            });

            if (needsUpdate) {
                const totalPrice = updatedProducts.reduce((total, item) => {
                    const productId = item?.product?._id;
                    if (productId && flashSaleProducts[productId]) {
                        return total + (flashSaleProducts[productId].discountPrice * item.quantity);
                    }
                    return total + (item.product.price * item.quantity);
                }, 0);

                const updatedCart = {
                    ...cart,
                    products: updatedProducts,
                    totalPrice
                };

                dispatch(setCart(updatedCart));
            }
        }
    }, [flashSaleProducts, dispatch]);

    const formRef = useRef(null);
    useEffect(() => {
        if (formRef.current && user) {
            formRef.current.setFieldsValue({
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber,
                city: user?.address?.city,
                district: user?.address?.district,
                ward: user?.address?.ward,
                detailedAddress: user?.address?.detailedAddress,
            });
        }
    }, [user]);

    const updateProductMutation = useMutation({
        mutationFn: async ({ productId, quantity }) => {
            const accessToken = handleGetAccessToken();
            return cartService.updateProduct(accessToken, productId, quantity);
        },
        onSuccess: (data) => {
            dispatch(setCart(data?.cart));
        },
        onError: (error) => {
            message.error(error?.respond?.message, 3);
        },
    });

    const [address, setAddress] = useState({
        city: user?.address?.city,
        district: user?.address?.district,
        ward: user?.address?.ward,
    });

    const districts =
        address.city &&
        addressVietNam.find((city) => city.name === address.city)?.districts;

    const wards =
        address.district &&
        districts?.find((district) => district.name === address.district)?.wards;

    const handleCityChange = (value) => {
        setAddress({
            city: value,
            district: null,
            ward: null,
            specificAddress: "",
        });
    };

    const handleDistrictChange = (value) => {
        setAddress((prev) => ({
            ...prev,
            district: value,
            ward: null,
        }));
    };

    const handleWardChange = (value) => {
        setAddress((prev) => ({
            ...prev,
            ward: value,
        }));
    };

    const handleQuantityChange = (id, value) => {

        const currentItem = cart?.products?.find(item => item.product?._id === id);
        if (!currentItem) return;

        const currentQuantity = currentItem.quantity;
        const quantityChange = value - currentQuantity;

        if (quantityChange > 0 && flashSaleProducts[id]) {
            const flashSaleData = JSON.parse(localStorage.getItem(`flashSale_${id}`));
            if (flashSaleData) {
                const soldCount = flashSaleData.soldCount || 0;
                const availableQuantity = flashSaleData.quantity || 0;
                const remainingQuantity = availableQuantity - soldCount;

                if (soldCount + quantityChange > availableQuantity) {
                    if (remainingQuantity <= 0) {
                        message.warning(`Sản phẩm đã hết số lượng Flash Sale. Nếu bạn tiếp tục mua, sẽ được tính theo giá thông thường.`, 5);
                        localStorage.removeItem(`flashSale_${id}`);
                        setFlashSaleProducts(prev => {
                            const updated = { ...prev };
                            delete updated[id];
                            return updated;
                        });
                        updateProductMutation.mutate({ productId: id.toString(), quantity: value });
                        return;
                    } else {
                        message.warning(`Chỉ còn ${remainingQuantity} sản phẩm với giá Flash Sale. Số lượng đã được điều chỉnh.`, 5);

                        const maxQuantity = remainingQuantity + currentQuantity;
                        updateProductMutation.mutate({ productId: id.toString(), quantity: maxQuantity });
                        return;
                    }
                }

                updateFlashSaleSoldCount(id, quantityChange);
            }
        }

        updateProductMutation.mutate({ productId: id.toString(), quantity: value });
    };

    const handleRemoveItem = (id) => {
        updateProductMutation.mutate({ productId: id.toString(), quantity: 0 });
    };

    //Create order
    const createOrderMutation = useMutation({
        mutationFn: async ({ shippingInfo, paymentMethod, cartWithFlashSale }) => {
            if (paymentMethod === "VNPay") {
                setIsRedirecting(true);
            }
            const accessToken = handleGetAccessToken();
            return orderService.createOrder(accessToken, shippingInfo, paymentMethod, cartWithFlashSale);
        },
        onSuccess: (data) => {
            if (data.paymentMethod === "COD") {
                message.success(data?.message, 3);
                dispatch(resetCart());
            } else if (data.paymentMethod === "VNPay") {
                message.loading("Đang chuyển hướng đến cổng thanh toán VNPay...", 2);
            }

            try {
                if (cart?.products && Object.keys(flashSaleProducts).length > 0) {
                    cart.products.forEach(item => {
                        const productId = item?.product?._id;
                        if (productId && flashSaleProducts[productId]) {
                            const flashSaleData = JSON.parse(localStorage.getItem(`flashSale_${productId}`));
                            if (flashSaleData) {
                                const newSoldCount = (flashSaleData.soldCount || 0) + item.quantity;
                                flashSaleData.soldCount = newSoldCount;

                                localStorage.setItem(`flashSale_${productId}`, JSON.stringify(flashSaleData));

                                if (newSoldCount >= flashSaleData.quantity) {
                                    localStorage.removeItem(`flashSale_${productId}`);
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Lỗi khi cập nhật số lượng Flash Sale:", error);
            }

            if (data.paymentUrl) {
                setTimeout(() => {
                    dispatch(resetCart());
                    window.location.href = data.paymentUrl;
                }, 2000);
            } else {
                dispatch(resetCart());
                navigate(`/order/details/${data?.newOrder?._id}`);
            }
        },
        onError: (error) => {
            setIsRedirecting(false);
            message.error(error?.respond?.message || "Đã có lỗi xảy ra khi tạo đơn hàng", 3);
        },
    });

    const onFinishOrder = async (value) => {
        const {
            name,
            phoneNumber,
            city,
            district,
            ward,
            detailedAddress,
            paymentMethod,
        } = value;

        const shippingInfo = {
            name,
            phoneNumber,
            city,
            district,
            ward,
            detailedAddress,
        };

        const cartWithFlashSale = {
            ...cart,
            flashSaleProducts: flashSaleProducts,
            shippingFee: SHIPPING_FEE
        };

        await createOrderMutation.mutateAsync({
            shippingInfo,
            paymentMethod,
            cartWithFlashSale
        });
    };

    const calculateTotalSavings = () => {
        let totalSavings = 0;
        if (Object.keys(flashSaleProducts).length > 0 && cart?.products?.length > 0) {
            cart.products.forEach(item => {
                const productId = item?.product?._id;
                if (productId && flashSaleProducts[productId]) {
                    const originalPrice = item.product.price;

                    const flashSalePrice = flashSaleProducts[productId].discountPrice;

                    if (originalPrice > flashSalePrice) {
                        const savings = (originalPrice - flashSalePrice) * item.quantity;
                        totalSavings += savings;
                    }
                }
            });
        }
        return totalSavings;
    };

    return (
        <Spin
            spinning={updateProductMutation?.isPendingUpdate || createOrderMutation?.isPending}
            tip={createOrderMutation?.isPending ? "Đang xử lý đơn hàng..." : "Đang cập nhật..."}
        >
            <Modal
                open={isRedirecting}
                closable={false}
                footer={null}
                centered
                className="vnpay-redirect-modal"
                maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
            >
                <div className="text-center py-6">
                    <LoadingOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} spin />
                    <Title level={3} style={{ marginBottom: 16 }}>Đang chuyển hướng đến cổng thanh toán VNPay</Title>
                    <p style={{ fontSize: 16 }}>Vui lòng không đóng trình duyệt hoặc tải lại trang...</p>
                    <p style={{ fontSize: 14, color: '#888', marginTop: 12 }}>Bạn sẽ được chuyển hướng tự động sau vài giây</p>
                </div>
            </Modal>

            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                    <Title level={3} className="mb-4">
                        Giỏ hàng của bạn
                    </Title>

                    <List
                        dataSource={cart?.products}
                        renderItem={(item) => {
                            const productId = item?.product?._id;
                            const isFlashSale = !!flashSaleProducts[productId];

                            const flashSaleInfo = isFlashSale ? flashSaleProducts[productId] : null;

                            const originalPrice = item?.product?.price || 0;

                            const flashSalePrice = isFlashSale ? flashSaleInfo.discountPrice : originalPrice;

                            const discount = isFlashSale ? Math.round((1 - flashSalePrice / originalPrice) * 100) : 0;

                            return (
                                <List.Item className="border-b pb-4 mb-4 flex">
                                    <Row
                                        gutter={[16, 16]}
                                        align="middle"
                                        className="w-full"
                                    >
                                        <Col span={4}>
                                            {/* Ảnh sản phẩm */}
                                            <div className="relative">
                                                <img
                                                    src={item?.product?.imageUrl[0]}
                                                    alt={item?.product?.name}
                                                    className="h-20 w-auto rounded-lg object-contain"
                                                />
                                                {isFlashSale && (
                                                    <Tag color="volcano" className="absolute top-0 right-0">
                                                        <ThunderboltOutlined /> -{discount}%
                                                    </Tag>
                                                )}
                                            </div>
                                        </Col>
                                        <Col span={2}>
                                            {/* Nút xóa */}
                                            <Button
                                                type="text"
                                                danger
                                                icon={<CloseOutlined />}
                                                onClick={() => handleRemoveItem(item?.product?._id)}
                                                className="hover:bg-red-50 hover:text-red-500 border hover:border-red-400 px-2 py-1 rounded-lg transition-all"
                                            >
                                                Xóa
                                            </Button>
                                        </Col>
                                        <Col span={6}>
                                            <Text strong>{item?.product?.name}</Text>
                                            <br />
                                            <Text type="secondary">Màu: {item?.product?.color || "Không có thông tin"}</Text>
                                            {isFlashSale && (
                                                <div>
                                                    <Tag color="orange" className="mt-1">
                                                        <ThunderboltOutlined /> Flash Sale
                                                    </Tag>
                                                </div>
                                            )}
                                        </Col>
                                        <Col span={4}>
                                            <InputNumber
                                                min={1}
                                                max={item?.product?.countInStock}
                                                value={item.quantity}
                                                onChange={(value) =>
                                                    handleQuantityChange(item?.product?._id, value)
                                                }
                                            />
                                        </Col>
                                        <Col span={4}>
                                            {isFlashSale ? (
                                                <div className="flex flex-col items-end text-right">
                                                    <div className="mb-1">
                                                        <Text delete type="secondary" className="text-xs">
                                                            {originalPrice.toLocaleString("vi-VN")}₫
                                                        </Text>
                                                    </div>
                                                    <div className="mb-1">
                                                        <Text className="text-xs text-green-500">
                                                            {((originalPrice - flashSalePrice) * item.quantity).toLocaleString("vi-VN")}₫
                                                        </Text>
                                                    </div>
                                                    <div>
                                                        <Text strong className="text-red-500">
                                                            {(flashSalePrice * item.quantity).toLocaleString("vi-VN")}₫
                                                        </Text>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Text strong className="block text-right text-red-500">
                                                    {(originalPrice * item.quantity).toLocaleString("vi-VN")}₫
                                                </Text>
                                            )}
                                        </Col>
                                    </Row>
                                </List.Item>
                            );
                        }}
                    />

                    {/* Tạm tính */}
                    <div className="border-t pt-4 mt-4">
                        <Row align="middle" justify="end">
                            <Col>
                                <div className="flex flex-col items-end">
                                    {cart?.products?.length > 0 && (
                                        <>
                                            <div className="flex items-center mb-1">
                                                <Text className="text-sm mr-2">Giá gốc:</Text>
                                                <Text className="text-sm">{cart?.totalPrice ? (calculateTotalSavings() + cart.totalPrice).toLocaleString("vi-VN") : 0}₫</Text>
                                            </div>
                                            {Object.keys(flashSaleProducts).length > 0 && (
                                                <div className="flex items-center mb-1">
                                                    <Text className="text-green-500 text-sm mr-2">Giảm:</Text>
                                                    <Text className="text-green-500 text-sm">
                                                        {calculateTotalSavings().toLocaleString("vi-VN")}₫
                                                    </Text>
                                                </div>
                                            )}
                                            <div className="flex items-center mb-1">
                                                <Text className="text-sm mr-2">Tạm tính:</Text>
                                                <Text className="text-sm">
                                                    {cart?.totalPrice?.toLocaleString("vi-VN")}₫
                                                </Text>
                                            </div>
                                            <div className="flex items-center mb-1">
                                                <Text className="text-sm mr-2">Phí vận chuyển:</Text>
                                                <Text className="text-sm">
                                                    {SHIPPING_FEE.toLocaleString("vi-VN")}₫
                                                </Text>
                                            </div>
                                            <div className="flex items-center">
                                                <Text className="mr-2 text-red-500" style={{ fontSize: '16px' }}>Tổng cộng:</Text>
                                                <Title level={4} style={{ color: "#ED1C24", margin: 0 }}>
                                                    {cart?.totalPrice ? (cart.totalPrice + SHIPPING_FEE).toLocaleString("vi-VN") : SHIPPING_FEE.toLocaleString("vi-VN")}₫
                                                </Title>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* Kiểm tra giỏ hàng trống */}
                    {cart?.products?.length > 0 && (
                        <>
                            <Form
                                layout="vertical"
                                className="mt-6"
                                ref={formRef}
                                onFinish={onFinishOrder}
                            >
                                <Title level={4}>Thông tin giao hàng</Title>

                                <Form.Item label="Họ và Tên" name="name" required>
                                    <Input placeholder="Nhập họ và tên" />
                                </Form.Item>

                                <Form.Item label="Số điện thoại" name="phoneNumber" required>
                                    <Input placeholder="Nhập số điện thoại" />
                                </Form.Item>

                                <Form.Item label="Tỉnh/Thành phố" name="city" required>
                                    <Select
                                        options={addressVietNam.map((city) => ({
                                            value: city.name,
                                            label: city.name,
                                        }))}
                                        placeholder="Chọn Tỉnh/Thành phố"
                                        onChange={handleCityChange}
                                        defaultValue={address.city}
                                    />
                                </Form.Item>

                                <Form.Item label="Quận/Huyện" name="district" required>
                                    <Select
                                        options={districts?.map((district) => ({
                                            value: district.name,
                                            label: district.name,
                                        }))}
                                        placeholder="Chọn Quận/Huyện"
                                        onChange={handleDistrictChange}
                                        defaultValue={address.district}
                                    />
                                </Form.Item>

                                <Form.Item label="Phường/Xã" name="ward" required>
                                    <Select
                                        options={wards?.map((ward) => ({
                                            value: ward.name,
                                            label: ward.name,
                                        }))}
                                        placeholder="Chọn Phường/Xã"
                                        onChange={handleWardChange}
                                        defaultValue={address.ward}
                                    />
                                </Form.Item>

                                <Form.Item label="Địa chỉ" name="detailedAddress" required>
                                    <Input placeholder="Nhập địa chỉ" />
                                </Form.Item>

                                <Form.Item
                                    label="Phương thức thanh toán"
                                    name="paymentMethod"
                                    initialValue="COD"
                                    required
                                >
                                    <Radio.Group>
                                        <Radio value="COD">Thanh toán khi nhận hàng</Radio>
                                        <Radio value="VNPay">Thanh toán bằng VNPay</Radio>
                                    </Radio.Group>
                                </Form.Item>

                                {/* Nút đặt hàng */}
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        className="w-full py-6 font-bold"
                                        htmlType="submit"
                                        loading={createOrderMutation.isPending && !isRedirecting}
                                        disabled={createOrderMutation.isPending || isRedirecting}
                                    >
                                        {isRedirecting ? "Đang chuyển hướng đến VNPay..." : "Đặt hàng"}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </>
                    )}
                </div>
            </div>
        </Spin>
    );
};

export default CartPage;
