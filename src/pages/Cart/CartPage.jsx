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
} from "antd";
import addressVietNam from "../../constants/addressConstants";
import { CloseOutlined } from "@ant-design/icons";
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
        mutationFn: async ({ shippingInfo, paymentMethod }) => {
            const accessToken = handleGetAccessToken();
            return orderService.createOrder(accessToken, shippingInfo, paymentMethod);
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

        await createOrderMutation.mutateAsync({ shippingInfo, paymentMethod });
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
                        renderItem={(item) => (
                            <List.Item className="border-b pb-4 mb-4 flex">
                                <Row gutter={16} className="w-full items-center">
                                    <Col
                                        span={6}
                                        className="flex flex-col items-center space-y-2"
                                    >
                                        {/* Ảnh sản phẩm */}
                                        <img
                                            src={item?.product?.imageUrl[0]}
                                            alt={item?.product?.name}
                                            className="h-20 w-auto rounded-lg object-contain"
                                        />

                                        {/* Nút xóa */}
                                        <Button
                                            type="text"
                                            danger
                                            icon={<CloseOutlined />} // Dùng icon "X" của Ant Design
                                            onClick={() => handleRemoveItem(item?.product?._id)}
                                            className="hover:bg-red-50 hover:text-red-500 border hover:border-red-400 px-2 py-1 rounded-lg transition-all"
                                        >
                                            Xóa
                                        </Button>
                                    </Col>
                                    <Col span={10}>
                                        <Text strong>{item?.product?.name}</Text>
                                        <br />
                                        <Text type="secondary">Màu: {item?.product?.color}</Text>
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
                                        <Text strong>
                                            {(item?.product?.price * item.quantity).toLocaleString(
                                                "vi-VN"
                                            )} ₫
                                        </Text>
                                    </Col>
                                </Row>
                            </List.Item>
                        )}
                    />

                    {/* Tạm tính */}
                    <div className="border-t pt-4 mt-4">
                        <Title level={4} style={{ textAlign: "right", color: "#323232" }}>
                            Tạm tính: {cart?.totalPrice?.toLocaleString("vi-VN")}₫
                        </Title>
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

                            {/* Tổng tiền nằm ở dưới cùng trang */}
                            <div className="p-4">
                                <Title level={4} style={{ textAlign: "right", color: "#ED1C24" }}>
                                    Tổng tiền: {cart?.totalPrice?.toLocaleString("vi-VN")}₫
                                </Title>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Spin>
    );
};

export default CartPage;
