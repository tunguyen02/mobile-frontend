import { DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Col, Modal, Popconfirm, Row, Table, Card, Typography, Avatar, Divider, Space, Button, Tooltip, Tag, Input } from 'antd';
import { useEffect, useState } from 'react';
import userService from '../../services/userService';

const { Title, Text } = Typography;

const Users = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const handleDelete = (userId) => {
        try {
            userService.deleteUser(userId);
            setUsers(users.filter(user => user._id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleView = async (userId) => {
        try {
            setLoading(true);
            const user = await userService.getUserById(userId);
            setSelectedUser(user.data);
            setIsModalOpen(true);
            console.log("User:", user.data);
        } catch (error) {
            console.error("Error fetching user by ID:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
        console.log('params', pagination, filters, sorter);
    };

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                setLoading(true);
                const users = await userService.getAllUsers();
                setUsers(users.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllUsers();
    }, []);

    const filteredUsers = users.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.phoneNumber?.includes(searchText)
    );

    const columns = [
        {
            title: 'STT',
            dataIndex: 'no',
            key: 'no',
            render: (text, record, index) => (
                <Tag color="blue" className="text-center font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                </Tag>
            ),
            width: 70,
            align: 'center',
        },
        {
            title: 'Ảnh đại diện',
            dataIndex: 'avatarUrl',
            render: (text) => (
                <Avatar
                    src={text || 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg'}
                    alt="avatar"
                    size={60}
                    className="shadow-sm"
                />
            ),
            width: 100,
            align: 'center',
        },
        {
            title: 'Tên người dùng',
            dataIndex: 'name',
            render: (text) => <Text strong>{text}</Text>,
            width: 180,
        },
        {
            title: 'Email người dùng',
            dataIndex: 'email',
            width: 220,
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phoneNumber',
            width: 150,
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            render: (text) => {
                return (
                    <Tag color={text === 'Admin' ? 'gold' : 'geekblue'} className="text-center px-3 py-1">
                        {text}
                    </Tag>
                );
            },
            filters: [
                {
                    text: 'User',
                    value: 'User',
                },
                {
                    text: 'Admin',
                    value: 'Admin',
                }
            ],
            onFilter: (value, record) => record.role === value,
            width: 120,
            align: 'center',
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<EyeOutlined />}
                            onClick={() => handleView(record._id)}
                            className="bg-blue-500 hover:bg-blue-600"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa người dùng"
                        description="Bạn chắc chắn muốn xóa người dùng này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        placement="left"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button
                                danger
                                type="primary"
                                shape="circle"
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card className="shadow-md">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <Title level={4} className="mb-1">Quản lý người dùng</Title>
                    <Text type="secondary">Quản lý danh sách người dùng và phân quyền</Text>
                </div>
                <div className="flex items-center gap-3">
                    <Input.Search
                        placeholder="Tìm kiếm người dùng..."
                        allowClear
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 250 }}
                    />
                </div>
            </div>

            <Divider className="my-4" />

            <Table
                columns={columns}
                dataSource={filteredUsers}
                rowKey="_id"
                onChange={handleTableChange}
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50', '100'],
                    showTotal: (total) => `Tổng cộng ${total} người dùng`,
                }}
                bordered
            />

            <Modal
                title={<Text strong>Thông tin chi tiết người dùng</Text>}
                open={isModalOpen}
                onOk={() => setIsModalOpen(false)}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={600}
                centered
            >
                {selectedUser ? (
                    <div className="py-2">
                        <Row gutter={24} className="mb-4">
                            <Col span={8} className="flex justify-center items-start">
                                <Avatar
                                    src={selectedUser.avatarUrl || 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg'}
                                    alt="avatar"
                                    size={120}
                                    className="shadow-md"
                                />
                            </Col>
                            <Col span={16}>
                                <div className="space-y-3">
                                    <div>
                                        <Text type="secondary">Họ tên:</Text>
                                        <div><Text strong className="text-lg">{selectedUser.name}</Text></div>
                                    </div>
                                    <div>
                                        <Text type="secondary">Email:</Text>
                                        <div><Text>{selectedUser.email}</Text></div>
                                    </div>
                                    <div>
                                        <Text type="secondary">Số điện thoại:</Text>
                                        <div><Text>{selectedUser.phoneNumber || 'Chưa cập nhật'}</Text></div>
                                    </div>
                                    <div>
                                        <Text type="secondary">Vai trò:</Text>
                                        <div>
                                            <Tag color={selectedUser.role === 'Admin' ? 'gold' : 'geekblue'} className="text-center px-3 py-1">
                                                {selectedUser.role}
                                            </Tag>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Divider orientation="left">Địa chỉ</Divider>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            {selectedUser.address && (selectedUser.address.detailedAddress || selectedUser.address.ward || selectedUser.address.district || selectedUser.address.city) ? (
                                <div>
                                    <Text>{selectedUser.address.detailedAddress}, {selectedUser.address.ward}, {selectedUser.address.district}, {selectedUser.address.city}</Text>
                                </div>
                            ) : (
                                <Text type="secondary" italic>Người dùng chưa cập nhật địa chỉ</Text>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <Text type="secondary">Đang tải thông tin người dùng...</Text>
                    </div>
                )}
            </Modal>
        </Card>
    )
}

export default Users