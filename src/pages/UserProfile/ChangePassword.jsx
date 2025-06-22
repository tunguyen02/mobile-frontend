import React, { useState } from "react";
import { Form, Input, Button, Card, message, Spin } from "antd";
import { LockOutlined, KeyOutlined, CheckOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import userService from "../../services/userService";
import { resetUser } from "../../redux/userStore";

const ChangePassword = () => {
    const [form] = Form.useForm();
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const { currentPassword, newPassword, confirmPassword } = values;

            // Kiểm tra mật khẩu mới và nhập lại mật khẩu
            if (newPassword !== confirmPassword) {
                message.error("Mật khẩu nhập lại không khớp!");
                setLoading(false);
                return;
            }

            // Kiểm tra mật khẩu mới khác mật khẩu cũ
            if (currentPassword === newPassword) {
                message.error("Mật khẩu mới phải khác mật khẩu hiện tại!");
                setLoading(false);
                return;
            }

            // Gọi API đổi mật khẩu
            await userService.changePassword(
                user.accessToken,
                currentPassword,
                newPassword,
                confirmPassword
            );

            message.success("Đổi mật khẩu thành công!");
            form.resetFields();

            // Đăng xuất sau khi đổi mật khẩu
            try {
                // Gọi API đăng xuất để xóa refresh token ở server
                await userService.signOut();
                // Cập nhật Redux store để đánh dấu đăng xuất
                dispatch(resetUser());
                // Xóa access token từ localStorage
                localStorage.removeItem("access_token");
            } catch (logoutError) {
                console.error("Lỗi khi đăng xuất:", logoutError);
            }

            // Chuyển hướng về trang đăng nhập sau khi đổi mật khẩu thành công
            setTimeout(() => {
                navigate("/sign-in");
            }, 1500);
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error);

            // Hiển thị thông báo lỗi cụ thể từ server nếu có
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
                <Card
                    title={
                        <div className="text-center text-xl font-bold">
                            <LockOutlined className="mr-2 text-blue-500" />
                            Đổi Mật Khẩu
                        </div>
                    }
                    bordered={true}
                    className="shadow-md"
                >
                    <Spin spinning={loading}>
                        <Form
                            form={form}
                            name="change_password"
                            layout="vertical"
                            onFinish={onFinish}
                        >
                            <Form.Item
                                name="currentPassword"
                                label="Mật khẩu hiện tại"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập mật khẩu hiện tại!",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<KeyOutlined className="site-form-item-icon" />}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                name="newPassword"
                                label="Mật khẩu mới"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập mật khẩu mới!",
                                    },
                                    {
                                        min: 6,
                                        message: "Mật khẩu phải có ít nhất 6 ký tự!",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="site-form-item-icon" />}
                                    placeholder="Nhập mật khẩu mới"
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                label="Nhập lại mật khẩu mới"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập lại mật khẩu mới!",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("newPassword") === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Mật khẩu nhập lại không khớp!"));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<CheckOutlined className="site-form-item-icon" />}
                                    placeholder="Nhập lại mật khẩu mới"
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item className="mt-8">
                                <div className="flex space-x-4">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        className="bg-blue-500 w-full rounded-lg h-12 text-base font-medium"
                                        loading={loading}
                                    >
                                        Đổi Mật Khẩu
                                    </Button>
                                    <Button
                                        size="large"
                                        className="w-full rounded-lg h-12 text-base font-medium"
                                        onClick={() => navigate("/user/profile")}
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Card>
            </div>
        </div>
    );
};

export default ChangePassword; 