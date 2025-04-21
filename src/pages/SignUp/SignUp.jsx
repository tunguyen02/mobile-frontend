import { Button, Form, Input, Typography, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
const { Title } = Typography;
import userService from '../../services/userService';

const SignUp = () => {
    const navigate = useNavigate();
    const onFinish = async (values) => {
        try {
            const res = await userService.register(
                values.name,
                values.email,
                values.password,
                values.passwordConfirm
            );

            if (res.data) {
                message.success('Đăng ký thành công!');
                navigate('/sign-in');
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('exist')) {
                message.error('Email này đã được sử dụng. Vui lòng sử dụng email khác!');
            } else {
                message.error('Đăng ký thất bại! Vui lòng thử lại.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-md p-8 min-h-[550px] flex flex-col">
                <div className="text-center mb-8">
                    <Title level={2} className="text-gray-800 mb-4">Đăng ký tài khoản</Title>
                    <p className="text-gray-600">
                        Đã có tài khoản? <Link to="/sign-in" className="text-blue-600 hover:text-blue-800 font-medium">Đăng nhập</Link>
                    </p>
                </div>

                <Form
                    name="register"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    className="space-y-5 flex-grow"
                >
                    <Form.Item
                        name="name"
                        rules={[
                            { required: true, message: 'Hãy nhập tên của bạn' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined className="site-form-item-icon text-gray-400" />}
                            placeholder="Họ tên"
                            size="large"
                            className="rounded-lg h-12"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Hãy nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' },
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
                            { required: true, message: 'Hãy nhập mật khẩu!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                            placeholder="Mật khẩu"
                            size="large"
                            className="rounded-lg h-12"
                        />
                    </Form.Item>

                    <Form.Item
                        name="passwordConfirm"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Hãy xác nhận mật khẩu!' },
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
                            placeholder="Xác nhận mật khẩu"
                            size="large"
                            className="rounded-lg h-12"
                        />
                    </Form.Item>

                    <Form.Item className="mb-0 mt-auto pt-3">
                        <Button type="primary" htmlType="submit" size="large" className="w-full rounded-lg h-12 text-base font-medium">
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default SignUp;
