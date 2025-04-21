import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Table, Select, Card, Typography, Space, Tooltip, Tag, Divider, Image } from "antd";
import { useEffect, useState } from "react";
import brandService from "../../services/brandService";
import productService from "../../services/productService";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState("Apple");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBrands = async () => {
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
        };

        const fetchProductByBrand = async () => {
            setLoading(true);
            try {
                const products = await productService.getProductsByBrand(selectedBrand, 30);
                setProducts(products.products);
                console.log("Products:", products);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();
        fetchProductByBrand();

    }, [selectedBrand]);

    const handleEdit = (record) => {
        navigate(`/admin/products/detail/${record._id}`);
    };

    const handleDelete = (productId) => {
        try {
            productService.deleteProduct(productId);
            setProducts(products.filter(product => product._id !== productId));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const handleBrandChange = (value) => {
        setSelectedBrand(value);
    };

    const columns = [
        {
            title: 'STT',
            dataIndex: 'no',
            key: 'no',
            render: (text, record, index) => (
                <Tag color="blue" className="text-center font-medium">
                    {index + 1}
                </Tag>
            ),
            width: 70,
            align: 'center',
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'imageUrl',
            key: 'image',
            render: (text) => {
                const firstImage = Array.isArray(text) && text.length > 0 ? text[0] : '';
                return firstImage ? (
                    <Image
                        src={firstImage}
                        alt="product"
                        style={{ width: 60, height: 60, objectFit: 'contain' }}
                        preview={{
                            mask: <SearchOutlined style={{ fontSize: '16px' }} />
                        }}
                    />
                ) : null;
            },
            width: 100,
            align: 'center',
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>,
            width: 180,
        },
        {
            title: 'Màu sắc',
            dataIndex: 'color',
            key: 'color',
            render: (text) => <Tag color="cyan">{text}</Tag>,
            width: 120,
            align: 'center',
        },
        {
            title: 'Giá đã giảm',
            dataIndex: 'price',
            render: (text) => {
                if (text)
                    return <Text className="text-green-600 font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(text)}
                    </Text>
            },
            width: 160,
            align: 'right',
        },
        {
            title: 'Giá gốc',
            dataIndex: 'originalPrice',
            render: (text) => {
                if (text)
                    return <Text className="text-gray-500 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(text)}
                    </Text>
            },
            width: 160,
            align: 'right',
        },
        {
            title: 'Số lượng',
            dataIndex: 'countInStock',
            render: (text) => (
                <Tag color={text > 0 ? "green" : "red"} className="text-center font-medium">
                    {text}
                </Tag>
            ),
            width: 100,
            align: 'center',
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
                        title="Xóa sản phẩm"
                        description="Bạn chắc chắn muốn xóa sản phẩm này?"
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
            fixed: 'right'
        },
    ];

    return (
        <Card className="shadow-md">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <Title level={4} className="mb-1">Quản lý sản phẩm</Title>
                    <Text type="secondary">Quản lý danh sách các sản phẩm theo thương hiệu</Text>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/admin/products/create')}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center"
                    >
                        Thêm mới
                    </Button>
                </div>
            </div>

            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Text strong className="mr-3">Lọc theo thương hiệu:</Text>
                <Select
                    value={selectedBrand}
                    onChange={handleBrandChange}
                    style={{ minWidth: 150 }}
                    className="w-auto"
                    popupMatchSelectWidth={false}
                    dropdownStyle={{ minWidth: 150 }}
                >
                    {brands.map((brand) => (
                        <Select.Option key={brand._id} value={brand.name} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <img src={brand.logoUrl} alt={brand.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                <span>{brand.name}</span>
                            </div>
                        </Select.Option>
                    ))}
                </Select>
            </div>

            <Divider className="my-4" />

            <Table
                columns={columns}
                dataSource={products}
                loading={loading}
                rowKey="_id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
                }}
                bordered
            />
        </Card>
    );
};

export default Products;
