import { useState, useEffect } from "react";
import { 
    Table, 
    Button, 
    Modal, 
    Form, 
    Input, 
    DatePicker, 
    message, 
    Space, 
    Tag, 
    Popconfirm,
    Select,
    InputNumber,
    Divider
} from "antd";
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import moment from "moment";
import { useSelector } from "react-redux";
import flashSaleService from "../../services/flashSaleService";
import productService from "../../services/productService";

const { RangePicker } = DatePicker;
const { Option } = Select;

const FlashSales = () => {
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingFlashSale, setEditingFlashSale] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const user = useSelector((state) => state.user);

    const fetchFlashSales = async () => {
        setLoading(true);
        try {
            const data = await flashSaleService.getAllFlashSales();
            setFlashSales(data.data || []);
        } catch (error) {
            message.error('Không thể tải dữ liệu Flash Sales');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            setProducts(response.products || []);
        } catch (error) {
            message.error('Không thể tải dữ liệu sản phẩm');
            console.error(error);
        }
    };

    useEffect(() => {
        fetchFlashSales();
        fetchProducts();
    }, []);

    const showModal = (record = null) => {
        setEditingFlashSale(record);
        if (record) {
            const productList = record.products.map(item => ({
                productId: item.product._id,
                discountPrice: item.discountPrice,
                quantity: item.quantity
            }));
            setSelectedProducts(productList);
            
            form.setFieldsValue({
                title: record.title,
                timeRange: [moment(record.startTime), moment(record.endTime)],
                products: productList
            });
        } else {
            form.resetFields();
            setSelectedProducts([]);
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingFlashSale(null);
        setSelectedProducts([]);
    };

    const handleSubmit = async (values) => {
        try {
            const data = {
                title: values.title,
                startTime: values.timeRange[0].toISOString(),
                endTime: values.timeRange[1].toISOString(),
                products: selectedProducts.map(item => ({
                    product: item.productId,
                    discountPrice: item.discountPrice,
                    quantity: item.quantity
                }))
            };

            console.log('Submitting flash sale data:', data);

            if (editingFlashSale) {
                await flashSaleService.updateFlashSale(
                    editingFlashSale._id, 
                    data, 
                    user?.accessToken
                );
                message.success('Flash Sale đã được cập nhật thành công!');
            } else {
                await flashSaleService.createFlashSale(data, user?.accessToken);
                message.success('Flash Sale đã được tạo thành công!');
            }
            
            setIsModalVisible(false);
            form.resetFields();
            fetchFlashSales();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định';
            message.error('Có lỗi xảy ra: ' + errorMsg);
            
            // Log full error details in console
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await flashSaleService.deleteFlashSale(id, user?.accessToken);
            message.success('Flash Sale đã được xóa thành công!');
            fetchFlashSales();
        } catch (error) {
            message.error('Không thể xóa Flash Sale');
            console.error(error);
        }
    };

    const addProduct = () => {
        setSelectedProducts([...selectedProducts, { productId: '', discountPrice: 0, quantity: 1 }]);
    };

    const updateSelectedProduct = (index, field, value) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts[index][field] = value;
        setSelectedProducts(updatedProducts);
    };

    const removeProduct = (index) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts.splice(index, 1);
        setSelectedProducts(updatedProducts);
    };

    const getFlashSaleStatus = (record) => {
        const now = new Date();
        const startTime = new Date(record.startTime);
        const endTime = new Date(record.endTime);
        
        if (now < startTime) return 'upcoming';
        if (now > endTime) return 'ended';
        return 'active';
    };

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (text) => moment(text).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Số sản phẩm',
            dataIndex: 'products',
            key: 'productCount',
            render: (products) => products.length
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => {
                const status = getFlashSaleStatus(record);
                let color = 'blue';
                let text = 'Sắp diễn ra';
                
                if (status === 'active') {
                    color = 'green';
                    text = 'Đang diễn ra';
                } else if (status === 'ended') {
                    color = 'gray';
                    text = 'Đã kết thúc';
                }
                
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)} 
                        ghost
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa Flash Sale này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button 
                            type="primary" 
                            icon={<DeleteOutlined />} 
                            danger 
                            ghost
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold flex items-center">
                    <ThunderboltOutlined className="mr-2 text-yellow-500" /> Quản lý Flash Sale
                </h1>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => showModal()}
                >
                    Tạo Flash Sale mới
                </Button>
            </div>

            <Table 
                columns={columns} 
                dataSource={flashSales} 
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title={editingFlashSale ? "Cập nhật Flash Sale" : "Tạo Flash Sale mới"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Tiêu đề Flash Sale"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Nhập tiêu đề cho Flash Sale" />
                    </Form.Item>

                    <Form.Item
                        name="timeRange"
                        label="Thời gian diễn ra"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                    >
                        <RangePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            placeholder={['Thời gian bắt đầu', 'Thời gian kết thúc']}
                        />
                    </Form.Item>

                    <Divider orientation="left">Danh sách sản phẩm</Divider>
                    
                    {selectedProducts.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-4">
                            <div className="w-1/3">
                                <Select
                                    placeholder="Chọn sản phẩm"
                                    className="w-full"
                                    value={item.productId || undefined}
                                    onChange={(value) => updateSelectedProduct(index, 'productId', value)}
                                >
                                    {products.map(product => (
                                        <Option key={product._id} value={product._id}>
                                            {product.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            <div className="w-1/4">
                                <InputNumber
                                    placeholder="Giá khuyến mãi"
                                    className="w-full"
                                    value={item.discountPrice}
                                    onChange={(value) => updateSelectedProduct(index, 'discountPrice', value)}
                                    min={1}
                                    addonAfter="đ"
                                />
                            </div>
                            <div className="w-1/4">
                                <InputNumber
                                    placeholder="Số lượng"
                                    className="w-full"
                                    value={item.quantity}
                                    onChange={(value) => updateSelectedProduct(index, 'quantity', value)}
                                    min={1}
                                />
                            </div>
                            <Button 
                                type="primary" 
                                danger 
                                onClick={() => removeProduct(index)}
                                icon={<DeleteOutlined />}
                            />
                        </div>
                    ))}

                    <Form.Item>
                        <Button 
                            type="dashed" 
                            onClick={addProduct} 
                            block 
                            icon={<PlusOutlined />}
                        >
                            Thêm sản phẩm
                        </Button>
                    </Form.Item>

                    <Form.Item className="text-right">
                        <Space>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                disabled={selectedProducts.length === 0}
                            >
                                {editingFlashSale ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FlashSales; 