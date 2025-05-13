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
    ThunderboltOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import moment from "moment";
import dayjs from 'dayjs';
import { useSelector } from "react-redux";
import flashSaleService from "../../services/flashSaleService";
import productService from "../../services/productService";

const { RangePicker } = DatePicker;
const { Option } = Select;

const FlashSales = () => {
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
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
            if (data && data.data) {
                console.log('Loaded flash sales:', data.data);
                setFlashSales(data.data || []);
            } else {
                console.error('Invalid response format:', data);
                setFlashSales([]);
                message.error('Định dạng dữ liệu không hợp lệ');
            }
        } catch (error) {
            console.error('Error fetching flash sales:', error);
            message.error('Không thể tải dữ liệu Flash Sales');
            setFlashSales([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const response = await productService.getAllProducts();
            setProducts(response.products || []);
        } catch (error) {
            message.error('Không thể tải dữ liệu sản phẩm');
            console.error(error);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchFlashSales();
        fetchProducts();
    }, []);

    // Thêm console.log để debug
    useEffect(() => {
        console.log('Current editing flash sale:', editingFlashSale);
    }, [editingFlashSale]);

    useEffect(() => {
        console.log('Selected products:', selectedProducts);
    }, [selectedProducts]);

    const showModal = (record = null) => {
        setEditingFlashSale(record);
        if (record) {
            try {
                const productList = record.products.map(item => {
                    // Kiểm tra nếu item.product là object (đã được populate) hoặc chỉ là id
                    const productId = typeof item.product === 'object' ? item.product._id : item.product;
                    const productPrice = typeof item.product === 'object' ? item.product.price : 0;

                    return {
                        productId,
                        originalPrice: productPrice,
                        discountPrice: item.discountPrice,
                        quantity: item.quantity,
                        soldCount: item.soldCount || 0,
                        initialQuantity: item.quantity,
                        remainingQuantity: item.quantity - (item.soldCount || 0)
                    };
                });
                setSelectedProducts(productList);

                // Sử dụng dayjs thay vì moment cho antd 5, hoặc giữ moment nếu dùng antd 4
                const startMoment = dayjs ? dayjs(record.startTime) : moment(record.startTime);
                const endMoment = dayjs ? dayjs(record.endTime) : moment(record.endTime);

                form.setFieldsValue({
                    title: record.title,
                    timeRange: [startMoment, endMoment],
                    products: productList
                });
            } catch (error) {
                console.error("Lỗi khi cài đặt giá trị form:", error);
                message.error("Có lỗi xảy ra khi mở form chỉnh sửa");
            }
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
            const startTime = values.timeRange[0].toDate ? values.timeRange[0].toDate().toISOString() : values.timeRange[0].toISOString();
            const endTime = values.timeRange[1].toDate ? values.timeRange[1].toDate().toISOString() : values.timeRange[1].toISOString();

            const productsData = selectedProducts.map(item => {
                if (editingFlashSale) {
                    const newQty = item.soldCount + item.remainingQuantity;
                    return {
                        product: item.productId,
                        discountPrice: item.discountPrice,
                        quantity: newQty,
                        soldCount: item.soldCount || 0
                    };
                } else {
                    return {
                        product: item.productId,
                        discountPrice: item.discountPrice,
                        quantity: item.quantity,
                        soldCount: 0
                    };
                }
            });

            const data = {
                title: values.title,
                startTime,
                endTime,
                products: productsData
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
        setSelectedProducts([...selectedProducts, { productId: '', originalPrice: 0, discountPrice: 0, quantity: 1 }]);
    };

    const updateSelectedProduct = (index, field, value) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts[index][field] = value;

        // Nếu đổi sản phẩm, cập nhật giá gốc từ sản phẩm
        if (field === 'productId') {
            const selectedProduct = products.find(p => p._id === value);
            if (selectedProduct) {
                updatedProducts[index].originalPrice = selectedProduct.price;

                // Nếu đang chỉnh sửa một flashsale hiện có, đảm bảo các trường khác được tính lại
                if (editingFlashSale) {
                    // Đặt lại soldCount cho sản phẩm mới
                    updatedProducts[index].soldCount = 0;
                    // Cập nhật số lượng còn lại bằng số lượng
                    updatedProducts[index].remainingQuantity = updatedProducts[index].quantity;
                }
            }
        }

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

    // Hàm định dạng tiền tệ
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '';
        return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
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
            title: 'Đã bán',
            key: 'soldCount',
            render: (_, record) => {
                // Tính tổng số sản phẩm đã bán
                const totalSold = record.products.reduce((sum, item) => sum + (item.soldCount || 0), 0);
                // Tính tổng số lượng sản phẩm
                const totalQuantity = record.products.reduce((sum, item) => sum + item.quantity, 0);
                return `${totalSold}/${totalQuantity}`;
            }
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
                        onClick={() => {
                            console.log('Edit flash sale:', record);
                            try {
                                // Kiểm tra dữ liệu
                                if (!record || !record.products) {
                                    message.error('Dữ liệu flash sale không hợp lệ');
                                    console.error('Invalid record:', record);
                                    return;
                                }

                                // Kiểm tra cấu trúc sản phẩm
                                for (const product of record.products) {
                                    if (!product.product) {
                                        message.error('Dữ liệu sản phẩm không hợp lệ');
                                        console.error('Invalid product:', product);
                                        return;
                                    }
                                }

                                showModal(record);
                            } catch (error) {
                                console.error('Error opening edit modal:', error);
                                message.error('Không thể mở form chỉnh sửa');
                            }
                        }}
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
                        <div key={index} className="flex gap-2 mb-4 items-start border p-3 rounded-md">
                            <div className="flex-1">
                                <Form.Item
                                    label="Sản phẩm"
                                    required
                                    className="mb-2"
                                >
                                    <Select
                                        value={item.productId || undefined}
                                        onChange={(value) => updateSelectedProduct(index, 'productId', value)}
                                        placeholder="Chọn sản phẩm"
                                        className="w-full"
                                        loading={productsLoading}
                                        disabled={editingFlashSale && item.productId}
                                    >
                                        {products && products.length > 0 ? products.map(product => (
                                            <Select.Option key={product._id} value={product._id}>
                                                {product.name} - {formatCurrency(product.price)}
                                            </Select.Option>
                                        )) : (
                                            <Select.Option value="" disabled>Không có sản phẩm</Select.Option>
                                        )}
                                    </Select>
                                </Form.Item>

                                <div className="flex gap-2">
                                    <Form.Item
                                        label="Giá gốc"
                                        className="flex-1 mb-2"
                                    >
                                        <Input
                                            value={formatCurrency(item.originalPrice)}
                                            disabled
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Giá khuyến mãi"
                                        className="flex-1 mb-2"
                                        required
                                    >
                                        <InputNumber
                                            value={item.discountPrice}
                                            onChange={(value) => updateSelectedProduct(index, 'discountPrice', value)}
                                            min={1}
                                            className="w-full"
                                            formatter={(value) => {
                                                if (!value && value !== 0) return '';
                                                return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                            }}
                                            parser={(value) => {
                                                if (!value) return 0;
                                                return parseFloat(value.replace(/\./g, ''));
                                            }}
                                            addonAfter="₫"
                                        />
                                    </Form.Item>
                                </div>

                                <div className="flex gap-2">
                                    <Form.Item
                                        label={editingFlashSale ? "Số lượng còn lại" : "Số lượng"}
                                        className="flex-1 mb-2"
                                        required
                                        tooltip={editingFlashSale ?
                                            "Nhập số lượng sản phẩm còn lại. Tổng số lượng sẽ là số lượng còn lại + số lượng đã bán." :
                                            "Nhập tổng số lượng sản phẩm cho Flash Sale"}
                                    >
                                        <InputNumber
                                            value={editingFlashSale ? item.remainingQuantity : item.quantity}
                                            onChange={(value) => {
                                                const updatedProducts = [...selectedProducts];
                                                if (editingFlashSale) {
                                                    updatedProducts[index].remainingQuantity = value;
                                                } else {
                                                    updatedProducts[index].quantity = value;
                                                }
                                                setSelectedProducts(updatedProducts);
                                            }}
                                            min={1}
                                            className="w-full"
                                        />
                                    </Form.Item>

                                    {editingFlashSale && (
                                        <Form.Item
                                            label="Đã bán"
                                            className="flex-1 mb-2"
                                        >
                                            <InputNumber
                                                value={item.soldCount || 0}
                                                disabled
                                                className="w-full"
                                            />
                                        </Form.Item>
                                    )}

                                    {editingFlashSale && (
                                        <Form.Item
                                            label="Tổng số lượng sau cập nhật"
                                            className="flex-1 mb-2"
                                            tooltip="Đây là tổng số lượng sản phẩm sau khi cập nhật (Số lượng còn lại + Đã bán)"
                                        >
                                            <InputNumber
                                                value={(item.remainingQuantity || 0) + (item.soldCount || 0)}
                                                disabled
                                                className="w-full"
                                            />
                                        </Form.Item>
                                    )}
                                </div>
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