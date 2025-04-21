import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input, message, Typography, Alert } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import userService from "../../services/userService";
import Loading from "../../components/Loading/Loading";

const { Title } = Typography;

function ResetPassword() {
    const [resetSuccess, setResetSuccess] = useState(false);
    const [form] = Form.useForm();
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            message.error('Token không hợp lệ!');
            navigate('/forgot-password');
        } else {
            console.log('Using reset token:', token);
        }
    }, [token, navigate]);

    const { mutate, isPending } = useMutation({
        mutationFn: (values) => {
            console.log('Resetting password with token:', token);
            return userService.resetPassword(token, values.password, values.passwordConfirm);
        },
        onSuccess: () => {
            message.success("Mật khẩu đã được đặt lại thành công!");
            setResetSuccess(true);
        },
        onError: (error) => {
            console.error("Reset password error:", error);
            if (error.response?.data?.message?.includes('invalid') ||
                error.response?.data?.message?.includes('expired')) {
                message.error('Liên kết không hợp lệ hoặc đã hết hạn!');
            } else if (error.response?.data?.message?.includes('match')) {
                message.error('Mật khẩu xác nhận không khớp!');
            } else {
                message.error('Có lỗi xảy ra! Vui lòng thử lại sau.');
            }
        },
    });

    const onFinish = (values) => {
        console.log('Reset password form values:', values);
        mutate(values);
    };

    const redirectToLogin = () => {
        navigate('/sign-in');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <Loading isLoading={isPending}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-md p-8 min-h-[550px] flex flex-col">
                    <div className="text-center mb-8">
                        <Title level={2} className="text-gray-800 mb-4">Đặt lại mật khẩu</Title>
                        <p className="text-gray-600">
                            Vui lòng nhập mật khẩu mới của bạn
                        </p>
                    </div>

                    {resetSuccess ? (
                        <div className="flex-grow flex flex-col justify-center">
                            <Alert
                                type="success"
                                message="Mật khẩu đã được đặt lại!"
                                description="Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập."
                                showIcon
                                className="mb-8"
                            />
                            <div className="text-center">
                                <Button
                                    type="primary"
                                    className="rounded-lg px-4 py-2"
                                    onClick={redirectToLogin}
                                >
                                    Đăng nhập ngay
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form
                            form={form}
                            name="reset-password"
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            className="space-y-5 flex-grow"
                        >
                            <Form.Item
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: "Hãy nhập mật khẩu mới!",
                                    },
                                    {
                                        min: 6,
                                        message: "Mật khẩu phải có ít nhất 6 ký tự!",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                                    placeholder="Mật khẩu mới"
                                    size="large"
                                    className="rounded-lg h-12"
                                />
                            </Form.Item>

                            <Form.Item
                                name="passwordConfirm"
                                dependencies={['password']}
                                rules={[
                                    {
                                        required: true,
                                        message: "Hãy xác nhận mật khẩu mới!",
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                                    placeholder="Xác nhận mật khẩu mới"
                                    size="large"
                                    className="rounded-lg h-12"
                                />
                            </Form.Item>

                            <div className="flex-grow"></div>

                            <Form.Item className="mb-0 mt-auto pt-3">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    className="w-full rounded-lg h-12 text-base font-medium"
                                    loading={isPending}
                                >
                                    Đặt lại mật khẩu
                                </Button>
                            </Form.Item>
                        </Form>
                    )}
                </div>
            </Loading>
        </div>
    );
}

export default ResetPassword; 