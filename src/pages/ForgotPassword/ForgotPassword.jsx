import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input, message, Typography, Alert } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import userService from "../../services/userService";
import Loading from "../../components/Loading/Loading";

const { Title } = Typography;

function ForgotPassword() {
    const [emailSent, setEmailSent] = useState(false);
    const [form] = Form.useForm();

    const { mutate, isPending } = useMutation({
        mutationFn: (values) => userService.forgotPassword(values.email),
        onSuccess: () => {
            message.success("Liên kết đặt lại mật khẩu đã được gửi vào email của bạn!");
            setEmailSent(true);
        },
        onError: (error) => {
            console.error("Forgot password error:", error);
            if (error.response?.data?.message?.includes('not found')) {
                message.error('Email không tồn tại trong hệ thống!');
            } else {
                message.error('Có lỗi xảy ra! Vui lòng thử lại sau.');
            }
        },
    });

    const onFinish = (values) => {
        console.log("Sending forgot password request for email:", values.email);
        mutate(values);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <Loading isLoading={isPending}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-md p-8 min-h-[550px] flex flex-col">
                    <div className="text-center mb-8">
                        <Title level={2} className="text-gray-800 mb-4">Quên mật khẩu</Title>
                        <p className="text-gray-600">
                            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
                        </p>
                    </div>

                    {emailSent ? (
                        <div className="flex-grow flex flex-col justify-center">
                            <Alert
                                type="success"
                                message="Email đã được gửi!"
                                description="Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn để đặt lại mật khẩu."
                                showIcon
                                className="mb-8"
                            />
                            <div className="text-center">
                                <Link to="/sign-in">
                                    <Button type="primary" className="rounded-lg px-4 py-2">
                                        Quay lại trang đăng nhập
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <Form
                            form={form}
                            name="forgot-password"
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            className="space-y-5 flex-grow"
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: "Hãy nhập email của bạn!",
                                    },
                                    {
                                        type: "email",
                                        message: "Email không hợp lệ!",
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined className="site-form-item-icon text-gray-400" />}
                                    placeholder="Email"
                                    size="large"
                                    className="rounded-lg h-12"
                                />
                            </Form.Item>

                            <div className="flex-grow"></div>

                            <div className="flex flex-col space-y-4">
                                <Form.Item className="mb-0">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        className="w-full rounded-lg h-12 text-base font-medium"
                                        loading={isPending}
                                    >
                                        Gửi liên kết đặt lại
                                    </Button>
                                </Form.Item>

                                <div className="text-center">
                                    <Link to="/sign-in" className="text-blue-600 hover:text-blue-800">
                                        Quay lại trang đăng nhập
                                    </Link>
                                </div>
                            </div>
                        </Form>
                    )}
                </div>
            </Loading>
        </div>
    );
}

export default ForgotPassword; 