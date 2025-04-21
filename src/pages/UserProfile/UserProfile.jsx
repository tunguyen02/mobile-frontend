import { UploadOutlined, UserOutlined, EditOutlined, SaveOutlined, LoadingOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, Button, Form, Input, message, Select, Upload, Card, Divider, Row, Col, Spin, Typography, Skeleton } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { handleGetAccessToken } from "../../services/axiosJWT";
import userService from "../../services/userService";
import { changeAvatar, updateUserProfile, setUser } from "../../redux/userStore";
import Loading from "../../components/Loading/Loading";
import axios from "axios";
import addressVietNam from "../../constants/addressConstants";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

function UserProfile() {
    const user = useSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const accessToken = handleGetAccessToken();
    const navigate = useNavigate();

    // Fetch user profile on component mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (accessToken) {
                try {
                    setInitialLoading(true);
                    const userData = await userService.getUserInformation(accessToken);
                    if (userData && userData.user) {
                        dispatch(setUser({ ...userData.user, accessToken }));
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    message.error("Không thể tải thông tin người dùng. Vui lòng thử lại sau.");
                } finally {
                    setInitialLoading(false);
                }
            } else {
                navigate("/sign-in");
            }
        };

        fetchUserProfile();
    }, [accessToken, dispatch, navigate]);

    // Update form fields when user data changes
    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                email: user.email || '',
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                city: user?.address?.city || undefined,
                district: user?.address?.district || undefined,
                ward: user?.address?.ward || undefined,
                detailedAddress: user?.address?.detailedAddress || '',
            });

            // Update address state
            setAddress({
                city: user?.address?.city || undefined,
                district: user?.address?.district || undefined,
                ward: user?.address?.ward || undefined,
            });
        }
    }, [user, form]);

    //Xử lý địa chỉ
    const [address, setAddress] = useState({
        city: user?.address?.city,
        district: user?.address?.district,
        ward: user?.address?.ward,
    });

    // Lấy danh sách tỉnh, quận và phường dựa trên trạng thái
    const cities = addressVietNam;
    const districts =
        address.city &&
        cities.find((city) => city.name === address.city)?.districts;

    const wards =
        address.district &&
        districts?.find((district) => district.name === address.district)?.wards;

    // Xử lý khi chọn tỉnh
    const handleCityChange = (value) => {
        setAddress({
            city: value,
            district: null,
            ward: null,
        });
        form.setFieldsValue({ district: undefined, ward: undefined });
    };

    // Xử lý khi chọn quận
    const handleDistrictChange = (value) => {
        setAddress((prev) => ({
            ...prev,
            district: value,
            ward: null,
        }));
        form.setFieldsValue({ ward: undefined });
    };

    // Xử lý khi chọn phường/xã
    const handleWardChange = (value) => {
        setAddress((prev) => ({
            ...prev,
            ward: value,
        }));
    };

    //Xử lý thay ảnh avatar
    const avatarUploadMutation = useMutation({
        mutationFn: (file) => {
            const accessToken = handleGetAccessToken();
            return userService.updateAvatar(accessToken, file);
        },
        onSuccess: (data) => {
            dispatch(changeAvatar({ avatarUrl: data.avatarUrl }));
            message.success("Cập nhật ảnh đại diện thành công!");
        },
        onError: (error) => {
            message.error("Cập nhật ảnh đại diện thất bại!");
        },
    });

    const handleOnChangeAvatar = ({ fileList }) => {
        const file = fileList[0];

        if (file && file.originFileObj && (file.status !== "uploading")) {
            avatarUploadMutation.mutate(fileList[0].originFileObj);
        }
    };

    //Xử lý thay đổi thông tin người dùng
    const mutationUpdateProfile = useMutation({
        mutationFn: (profile) => {
            setLoading(true);
            const accessToken = handleGetAccessToken();
            return userService.updateProfile(accessToken, profile);
        },
        onSuccess: (data) => {
            message.success("Cập nhật thông tin thành công!");
            dispatch(
                updateUserProfile({
                    name: data.user.name,
                    phoneNumber: data.user.phoneNumber,
                    address: data.user.address,
                })
            );
            setLoading(false);
        },
        onError: (error) => {
            message.error("Cập nhật thông tin thất bại!");
            setLoading(false);
        }
    });

    const onFinishUpdateProfile = (values) => {
        const profile = {
            name: values.name,
            phoneNumber: values.phoneNumber,
            address: {
                city: values.city,
                district: values.district,
                ward: values.ward,
                detailedAddress: values.detailedAddress,
            }
        };
        mutationUpdateProfile.mutate(profile);
    };

    if (initialLoading) {
        return (
            <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-lg rounded-lg overflow-hidden">
                        <Skeleton active avatar={{ size: 120, shape: "circle" }} paragraph={{ rows: 6 }} />
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg rounded-lg overflow-hidden">
                    <Title level={2} className="text-center mb-8">
                        <span className="text-blue-600">Thông tin tài khoản</span>
                    </Title>

                    <Row gutter={32}>
                        {/* Avatar Section */}
                        <Col xs={24} sm={24} md={8} lg={8} className="mb-8 md:mb-0">
                            <div className="flex flex-col items-center">
                                <Card
                                    className="w-full text-center shadow-md hover:shadow-lg transition-shadow duration-300"
                                    bordered={false}
                                >
                                    <div className="mb-6">
                                        <Text strong className="text-lg">Ảnh đại diện</Text>
                                    </div>

                                    <div className="mb-4 flex justify-center">
                                        {avatarUploadMutation.isPending ? (
                                            <Spin size="large" />
                                        ) : (
                                            <Avatar
                                                size={120}
                                                icon={<UserOutlined />}
                                                src={user?.avatarUrl}
                                                className="border-2 border-blue-200"
                                            />
                                        )}
                                    </div>

                                    <Upload
                                        onChange={handleOnChangeAvatar}
                                        maxCount={1}
                                        showUploadList={false}
                                        className="flex justify-center"
                                    >
                                        <Button
                                            icon={<EditOutlined />}
                                            size="middle"
                                            type="primary"
                                            className="rounded-lg px-4"
                                            loading={avatarUploadMutation.isPending}
                                        >
                                            Thay đổi ảnh
                                        </Button>
                                    </Upload>

                                    <Divider className="my-6" />

                                    <div className="text-center">
                                        <Text type="secondary">
                                            Tải lên ảnh đại diện của bạn với kích thước tối đa 2MB
                                        </Text>
                                    </div>
                                </Card>
                            </div>
                        </Col>

                        {/* Profile Form Section */}
                        <Col xs={24} sm={24} md={16} lg={16}>
                            <Card
                                className="shadow-md hover:shadow-lg transition-shadow duration-300"
                                bordered={false}
                            >
                                <Form
                                    form={form}
                                    name="user_profile"
                                    layout="vertical"
                                    onFinish={onFinishUpdateProfile}
                                    autoComplete="off"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                    >
                                        <Input
                                            readOnly
                                            style={{ cursor: 'default', backgroundColor: '#f5f5f5' }}
                                            className="rounded-lg"
                                        />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Họ và tên"
                                                name="name"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập họ và tên của bạn!' }
                                                ]}
                                            >
                                                <Input placeholder="Nhập họ và tên" className="rounded-lg" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Số điện thoại"
                                                name="phoneNumber"
                                                rules={[
                                                    {
                                                        pattern: /^0[0-9]{9,10}$/,
                                                        message: "Số điện thoại không hợp lệ!",
                                                    },
                                                ]}
                                            >
                                                <Input placeholder="Nhập số điện thoại" className="rounded-lg" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item label="Tỉnh/Thành phố" name="city">
                                        <Select
                                            options={cities.map((city) => ({
                                                value: city.name,
                                                label: city.name,
                                            }))}
                                            placeholder="Chọn Tỉnh/Thành phố"
                                            onChange={handleCityChange}
                                            className="rounded-lg"
                                        />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Quận/Huyện" name="district">
                                                <Select
                                                    options={districts?.map((district) => ({
                                                        value: district.name,
                                                        label: district.name,
                                                    }))}
                                                    placeholder="Chọn Quận/Huyện"
                                                    onChange={handleDistrictChange}
                                                    className="rounded-lg"
                                                    disabled={!address.city}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Phường/Xã" name="ward">
                                                <Select
                                                    options={wards?.map((ward) => ({
                                                        value: ward.name,
                                                        label: ward.name,
                                                    }))}
                                                    placeholder="Chọn Phường/Xã"
                                                    onChange={handleWardChange}
                                                    className="rounded-lg"
                                                    disabled={!address.district}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item label="Địa chỉ chi tiết" name="detailedAddress">
                                        <Input.TextArea
                                            placeholder="Nhập địa chỉ chi tiết (số nhà, đường, ...)"
                                            rows={3}
                                            className="rounded-lg"
                                        />
                                    </Form.Item>

                                    <Form.Item className="mt-6 flex justify-center">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            icon={<SaveOutlined />}
                                            loading={loading}
                                            size="large"
                                            className="min-w-[150px] rounded-lg h-10"
                                        >
                                            Lưu thông tin
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </Card>
            </div>
        </div>
    );
}

export default UserProfile;
