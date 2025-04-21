import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input, message, Typography } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
const { Title } = Typography;
import React, { useEffect } from "react";
import userService from "../../services/userService";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/userStore";
import { handleGetAccessToken } from "../../services/axiosJWT";

function SignIn() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const returnUrl = new URLSearchParams(location.search).get("returnUrl") || "/"; // Default to home page

    const { mutate, isPending } = useMutation({
        mutationFn: ({ email, password }) => userService.signIn(email, password),
        onSuccess: async (data) => {
            if (data?.accessToken) {
                localStorage.setItem("access_token", JSON.stringify(data.accessToken));
                message.success("Đăng nhập thành công!", 3);
                const accessToken = handleGetAccessToken();
                const user = await handleGetUserProfile(accessToken);
                if (user) {
                    navigate('/');
                }
            } else {
                message.error("Dữ liệu trả về không hợp lệ!", 3);
            }
        },
        onError: (error) => {
            if (error.response?.data?.message?.includes('Incorrect email or password')) {
                message.error('Email hoặc mật khẩu không chính xác!');
            } else {
                message.error('Đăng nhập thất bại! Vui lòng thử lại.');
            }
        },
    });

    const onFinish = (values) => {
        mutate(values);
    };

    const handleGetUserProfile = async (accessToken) => {
        try {
            const data = await userService.getUserInformation(accessToken);
            const user = { ...data.user, accessToken: accessToken };
            dispatch(setUser({ ...data.user, accessToken: accessToken }));
            return user;
        } catch (e) {
            console.log(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <Loading isLoading={isPending}>
                <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-md p-8 min-h-[550px] flex flex-col">
                    <div className="text-center mb-8">
                        <Title level={2} className="text-gray-800 mb-4">Đăng nhập</Title>
                        <p className="text-gray-600">
                            Chưa có tài khoản? <Link to="/sign-up" className="text-blue-600 hover:text-blue-800 font-medium">Đăng ký ngay</Link>
                        </p>
                    </div>

                    <Form
                        name="basic"
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
                                    message: "Hãy nhập email!",
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

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: "Mật khẩu không được để trống!",
                                },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                                placeholder="Mật khẩu"
                                size="large"
                                className="rounded-lg h-12"
                            />
                        </Form.Item>

                        <div className="flex justify-end mb-2">
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <div className="flex-grow"></div>

                        <Form.Item className="mb-0 mt-auto pt-3">
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                className="w-full rounded-lg h-12 text-base font-medium"
                                loading={isPending}
                            >
                                Đăng nhập
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Loading>
        </div>
    );
}

export default SignIn;
