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
} from "antd";
import addressVietNam from "../../constants/addressConstants";
import { CloseOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import cartService from "../../services/cartService";
import { handleGetAccessToken } from "../../services/axiosJWT";
import { resetCart, setCart } from "../../redux/cartSlice";
import orderService from "../../services/orderService";
import { useNavigate } from "react-router-dom";
const { Title, Text } = Typography;

const CartPage = () => {
    const user = useSelector((state) => state.user);
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [flashSaleProducts, setFlashSaleProducts] = useState({});

    // Kiểm tra các sản phẩm Flash Sale từ localStorage
    useEffect(() => {
        const flashSaleItems = {};

        if (cart?.products) {
            cart.products.forEach(item => {
                const productId = item?.product?._id;
                if (productId) {
                    try {
                        // Lấy thông tin Flash Sale từ localStorage
                        const flashSaleData = localStorage.getItem(`flashSale_${productId}`);
                        if (flashSaleData) {
                            const parsedData = JSON.parse(flashSaleData);

                            // Kiểm tra nếu Flash Sale còn hiệu lực
                            const now = new Date().getTime();
                            const endTime = parsedData.endTime ? new Date(parsedData.endTime).getTime() : 0;

                            if (endTime > now) {
                                flashSaleItems[productId] = parsedData;
                            } else {
                                // Xóa Flash Sale hết hạn
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

    // Cập nhật giỏ hàng với thông tin giá Flash Sale
    useEffect(() => {
        if (Object.keys(flashSaleProducts).length > 0 && cart?.products?.length > 0) {
            let needsUpdate = false;
            const updatedProducts = cart.products.map(item => {
                const productId = item?.product?._id;
                if (productId && flashSaleProducts[productId]) {
                    needsUpdate = true;
                    // Không thay đổi giá gốc, chỉ đánh dấu sản phẩm là Flash Sale
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
                // Tính lại tổng giá với giá Flash Sale
                const totalPrice = updatedProducts.reduce((total, item) => {
                    const productId = item?.product?._id;
                    if (productId && flashSaleProducts[productId]) {
                        // Sử dụng giá Flash Sale cho tính tổng
                        return total + (flashSaleProducts[productId].discountPrice * item.quantity);
                    }
                    // Sử dụng giá thường
                    return total + (item.product.price * item.quantity);
                }, 0);

                // Cập nhật giỏ hàng trong Redux
                const updatedCart = {
                    ...cart,
                    products: updatedProducts,
                    totalPrice
                };

                dispatch(setCart(updatedCart));
            }
        }
    }, [flashSaleProducts, dispatch]);

    const formRef = useRef(null); // Ref để truy cập Form
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

    //Mutation sửa đổi sản phẩm trong đơn hàng
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
        updateProductMutation.mutate({ productId: id.toString(), quantity: value });
    };

    const handleRemoveItem = (id) => {
        updateProductMutation.mutate({ productId: id.toString(), quantity: 0 });
    };

    //Create order
    const createOrderMutation = useMutation({
        mutationFn: async ({ shippingInfo, paymentMethod, cartWithFlashSale }) => {
            const accessToken = handleGetAccessToken();
            return orderService.createOrder(accessToken, shippingInfo, paymentMethod, cartWithFlashSale);
        },
        onSuccess: (data) => {
            message.success(data?.message, 3);
            dispatch(resetCart());
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                navigate("/order-success", {
                    state: {
                        order: data?.newOrder,
                        payment: data?.newPayment,
                    },
                });
            }
        },
        onError: (error) => {
            message.error(error?.respond?.message, 3);
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

        // Sao chép giỏ hàng để backend xử lý đúng các giá Flash Sale
        const cartWithFlashSale = {
            ...cart,
            flashSaleProducts: flashSaleProducts
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
                    // Giá thông thường từ API
                    const originalPrice = item.product.price;

                    // Giá Flash Sale từ localStorage
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
            spinning={
                updateProductMutation?.isPendingUpdate || createOrderMutation?.isPending
            }
        >
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                    {/* Tiêu đề */}
                    <Title level={3} className="mb-4">
                        Giỏ hàng của bạn
                    </Title>

                    {/* Danh sách sản phẩm */}
                    <List
                        dataSource={cart?.products}
                        renderItem={(item) => {
                            const productId = item?.product?._id;
                            const isFlashSale = !!flashSaleProducts[productId];

                            // Lấy thông tin Flash Sale nếu có
                            const flashSaleInfo = isFlashSale ? flashSaleProducts[productId] : null;

                            // Lấy giá gốc từ sản phẩm
                            const originalPrice = item?.product?.price || 0;

                            // Lấy giá Flash Sale nếu có
                            const flashSalePrice = isFlashSale ? flashSaleInfo.discountPrice : originalPrice;

                            // Tính phần trăm giảm giá nếu có Flash Sale
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
                                    <div className="flex items-center">
                                        <Text className="mr-2 text-red-500" style={{ fontSize: '16px' }}>Tạm tính:</Text>
                                        <Title level={4} style={{ color: "#ED1C24", margin: 0 }}>
                                            {cart?.totalPrice?.toLocaleString("vi-VN")}₫
                                        </Title>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    {/* Kiểm tra giỏ hàng trống */}
                    {cart?.products?.length > 0 && (
                        <>
                            {/* Form chọn địa chỉ */}
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
                                    >
                                        Đặt hàng
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
