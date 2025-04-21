import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Popconfirm, Table, Upload, Spin, Typography, Card, Space, Tooltip, Divider, Tag, Image } from 'antd';
import { useCallback, useEffect, useState } from 'react'
import brandService from '../../services/brandService';

const { Title, Text } = Typography;

const Brands = () => {

    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [editingFile, setEditingFile] = useState(null);
    const [searchText, setSearchText] = useState('');

    const [editForm] = Form.useForm();
    const [form] = Form.useForm();

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const brands = await brandService.getAllBrands();
            setBrands(brands);
            console.log("Brands:", brands);
        } catch (error) {
            console.error("Error fetching brands:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setEditingFile(null);

        editForm.setFieldsValue({
            name: brand.name,
            description: brand.description,
            logoUrl: brand.logoUrl,
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (brandId) => {
        try {
            brandService.deleteBrand(brandId);
            setBrands(brands.filter(brand => brand._id !== brandId));
            message.success("Xóa thương hiệu thành công!");
        } catch (error) {
            console.error("Error deleting brand:", error);
            message.error("Đã xảy ra lỗi khi xóa thương hiệu.");
        };
    }

    const onFinish = async (values) => {
        try {
            setIsCreating(true);
            if (!file) {
                throw new Error("Vui lòng thêm logo thương hiệu!");
            }
            const newBrand = {
                name: values.name,
                description: values.description,
                logoUrl: file
            };
            const response = await brandService.createBrand(newBrand, file);
            console.log("Response:", response);

            message.success("Thêm thương hiệu thành công!");
            form.resetFields();
            setFile(null);
            setIsModalOpen(false);
            fetchBrands();
        } catch (error) {
            message.error(error.message || "Đã xảy ra lỗi khi thêm thương hiệu.");
        } finally {
            setIsCreating(false);
        }
    };

    const onEditFinish = async (values) => {
        try {
            setIsUpdating(true);
            const updatedData = {
                name: values.name,
                description: values.description,
            };
            if (editingFile) {
                updatedData.logoUrl = editingFile;
            } else {
                updatedData.logoUrl = editingBrand.logoUrl;
            }
            await brandService.updateBrand(editingBrand._id, updatedData, editingFile);

            message.success("Cập nhật thương hiệu thành công!");
            setIsEditModalOpen(false);
            fetchBrands();
        } catch (error) {
            message.error(error.message || "Đã xảy ra lỗi khi cập nhật thương hiệu.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUploadChange = ({ file }) => {
        setFile(file);
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const filteredBrands = brands.filter(
        (brand) =>
            brand.name.toLowerCase().includes(searchText.toLowerCase()) ||
            brand.description.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'STT',
            dataIndex: 'no',
            render: (text, record, index) => (
                <Tag color="blue" className="text-center font-medium">
                    {index + 1}
                </Tag>
            ),
            width: 80,
            align: 'center',
        },
        {
            title: 'Logo',
            dataIndex: 'logoUrl',
            render: (text) => (
                <Image
                    src={text}
                    alt="brand logo"
                    style={{ width: 60, height: 60, objectFit: 'contain' }}
                    preview={{
                        mask: <SearchOutlined style={{ fontSize: '16px' }} />
                    }}
                />
            ),
            width: 100,
            align: 'center',
        },
        {
            title: 'Tên thương hiệu',
            dataIndex: 'name',
            render: (text) => <Text strong>{text}</Text>,
            width: 150
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            render: (text) => (
                <div>
                    <Text className="whitespace-pre-line">{text}</Text>
                </div>
            ),
            width: 400,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            className="bg-blue-500 hover:bg-blue-600"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa thương hiệu"
                        description="Bạn chắc chắn muốn xóa thương hiệu này?"
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
            width: 120,
            align: 'center',
        },
    ];

    const uploadButton = (
        <div className="ant-upload-text">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
        </div>
    );

    return (
        <Card className="shadow-md">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <Title level={4} className="mb-1">Quản lý thương hiệu</Title>
                    <Text type="secondary">Quản lý danh sách các thương hiệu trên hệ thống</Text>
                </div>
                <div className="flex items-center gap-3">
                    <Input.Search
                        placeholder="Tìm kiếm thương hiệu..."
                        allowClear
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center"
                    >
                        Thêm mới
                    </Button>
                </div>
            </div>

            <Divider className="my-4" />

            <Table
                columns={columns}
                dataSource={filteredBrands}
                loading={loading}
                rowKey='_id'
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} thương hiệu`,
                }}
                bordered
                scroll={{ x: 800 }}
            />

            {/* Modal thêm thương hiệu */}
            <Modal
                title={<Title level={4}>Thêm thương hiệu mới</Title>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
                centered
                destroyOnClose
            >
                <Divider className="mt-0" />
                <Spin spinning={isCreating}>
                    <Form
                        form={form}
                        onFinish={onFinish}
                        autoComplete="off"
                        layout="vertical"
                    >
                        <Form.Item
                            label="Tên thương hiệu"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
                        >
                            <Input placeholder="Nhập tên thương hiệu" />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                        >
                            <Input.TextArea
                                placeholder="Nhập mô tả về thương hiệu"
                                rows={4}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Logo thương hiệu"
                            name="logoUrl"
                            rules={[{ required: true, message: "Vui lòng tải lên logo thương hiệu" }]}
                        >
                            <Upload
                                listType="picture-card"
                                maxCount={1}
                                beforeUpload={() => false}
                                onChange={handleUploadChange}
                                accept="image/*"
                            >
                                {uploadButton}
                            </Upload>
                        </Form.Item>

                        <Form.Item className="mb-0 text-right">
                            <Space>
                                <Button onClick={() => setIsModalOpen(false)}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit" loading={isCreating} className="bg-blue-600 hover:bg-blue-700">
                                    Thêm thương hiệu
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>

            {/* Modal chỉnh sửa thương hiệu */}
            <Modal
                title={<Title level={4}>Chỉnh sửa thương hiệu</Title>}
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                width={600}
                centered
                destroyOnClose
            >
                <Divider className="mt-0" />
                <Spin spinning={isUpdating}>
                    <Form
                        form={editForm}
                        onFinish={onEditFinish}
                        autoComplete="off"
                        layout="vertical"
                    >
                        <Form.Item
                            label="Tên thương hiệu"
                            name="name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
                        >
                            <Input placeholder="Nhập tên thương hiệu" />
                        </Form.Item>

                        <Form.Item
                            label="Mô tả"
                            name="description"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                        >
                            <Input.TextArea
                                placeholder="Nhập mô tả về thương hiệu"
                                rows={4}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Logo thương hiệu"
                            name="logoUrl"
                        >
                            <Upload
                                listType="picture-card"
                                maxCount={1}
                                beforeUpload={() => false}
                                onChange={({ file }) => setEditingFile(file)}
                                defaultFileList={editingBrand?.logoUrl ? [{
                                    uid: '-1',
                                    name: 'logo.png',
                                    url: editingBrand.logoUrl,
                                }] : []}
                                accept="image/*"
                            >
                                {uploadButton}
                            </Upload>
                        </Form.Item>

                        <Form.Item className="mb-0 text-right">
                            <Space>
                                <Button onClick={() => setIsEditModalOpen(false)}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit" loading={isUpdating} className="bg-blue-600 hover:bg-blue-700">
                                    Cập nhật
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Spin>
            </Modal>
        </Card>
    )
}

export default Brands