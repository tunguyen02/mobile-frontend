import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, InputNumber, Row, Select, Upload, Spin, Card, Typography, Divider } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useEffect, useState } from 'react';
import brandService from '../../services/brandService';
import productService from '../../services/productService';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const ProductDetail = () => {
    const { productId } = useParams();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const uploadButton = (
        <div className="ant-upload-text">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
        </div>
    );

    useEffect(() => {
        const fetchBrandsAndProduct = async () => {
            setLoading(true);
            try {
                const [brandsData, productData] = await Promise.all([
                    brandService.getAllBrands(),
                    productService.getProductById(productId),
                ]);
                setBrands(brandsData);

                const brand = brandsData.find((brand) => brand._id === productData.product.brand);
                setSelectedBrand(brand ? brand._id : '');

                setFileList(
                    productData.product.imageUrl.map((url, index) => ({
                        uid: index,
                        name: `image-${index}`,
                        url,
                    }))
                );

                form.setFieldsValue({
                    ...productData.product,
                    brand: brand ? brand._id : '',
                });
            } catch (error) {
                console.error('Error fetching product details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrandsAndProduct();
    }, [productId, form]);


    const handleBrandChange = (value) => {
        setSelectedBrand(value);
    };

    const handleUploadChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const oldImages = fileList
                .filter((file) => file.url)
                .map((file) => file.url);

            const newImages = fileList
                .filter((file) => file.originFileObj)
                .map((file) => file.originFileObj);

            const images = [...oldImages, ...newImages];

            await productService.updateProduct(
                productId,
                {
                    ...values,
                    brand: selectedBrand,
                },
                images
            );

            navigate('/admin/products');
        } catch (error) {
            console.error('Error updating product:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-md">
            <div className="mb-4 flex justify-between items-center">
                <Title level={4} className="mb-0">Chi tiết sản phẩm</Title>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/products')}
                >
                    Quay lại
                </Button>
            </div>

            <Text type="secondary" className="mb-4 block">Xem và chỉnh sửa thông tin sản phẩm</Text>

            <Divider className="my-4" />

            <Spin spinning={loading} tip="Đang xử lý...">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                >
                    <Row gutter={24}>
                        <Col xs={24} lg={16}>
                            <Card className="mb-4">
                                <Form.Item
                                    label="Thương hiệu"
                                    name="brand"
                                    rules={[{ required: true, message: "Vui lòng chọn thương hiệu" }]}
                                >
                                    <Select
                                        placeholder="Chọn thương hiệu"
                                        value={selectedBrand}
                                        onChange={handleBrandChange}
                                        className="w-full"
                                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                        optionLabelProp="label"
                                    >
                                        {brands.map((brand) => (
                                            <Select.Option
                                                key={brand._id}
                                                value={brand._id}
                                                label={brand.name}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={brand.logoUrl}
                                                        alt={brand.name}
                                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                                    />
                                                    <span>{brand.name}</span>
                                                </div>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    label="Tên sản phẩm"
                                    name="name"
                                    rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                                >
                                    <Input placeholder="Nhập tên sản phẩm" />
                                </Form.Item>

                                <Form.Item
                                    label="Màu sắc"
                                    name="color"
                                    rules={[{ required: true, message: "Vui lòng nhập màu sắc" }]}
                                >
                                    <Input placeholder="Nhập màu sắc sản phẩm" />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Giá gốc"
                                            name="originalPrice"
                                            rules={[{ required: true, message: "Vui lòng nhập giá gốc" }]}
                                        >
                                            <InputNumber
                                                className="w-full"
                                                min={0}
                                                placeholder="Nhập giá gốc"
                                                formatter={(value) => {
                                                    if (!value) return '';
                                                    return `${new Intl.NumberFormat('vi-VN').format(value)}`;
                                                }}
                                                parser={(value) => value.replace(/[^\d]/g, '')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Giá giảm"
                                            name="price"
                                            rules={[{ required: true, message: "Vui lòng nhập giá đã giảm" }]}
                                        >
                                            <InputNumber
                                                className="w-full"
                                                min={0}
                                                placeholder="Nhập giá giảm"
                                                formatter={(value) => {
                                                    if (!value) return '';
                                                    return `${new Intl.NumberFormat('vi-VN').format(value)}`;
                                                }}
                                                parser={(value) => value.replace(/[^\d]/g, '')}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="Số lượng trong kho"
                                    name="countInStock"
                                    rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                                >
                                    <Input placeholder="Nhập số lượng sản phẩm có sẵn" />
                                </Form.Item>

                                <Form.Item
                                    label="Mô tả sản phẩm"
                                    name="description"
                                    rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Nhập mô tả chi tiết về sản phẩm"
                                    />
                                </Form.Item>

                                <div className="flex gap-3 mt-4">
                                    <Button
                                        onClick={() => navigate(`/admin/products/specifications/${productId}`)}
                                    >
                                        Thông số sản phẩm
                                    </Button>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={8}>
                            <Card className="mb-4">
                                <Title level={5} className="mb-4">Hình ảnh sản phẩm</Title>
                                <Form.Item
                                    name="imageUrl"
                                    rules={[{ required: true, message: "Vui lòng tải lên ít nhất một ảnh sản phẩm" }]}
                                >
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        onChange={handleUploadChange}
                                        beforeUpload={() => false}
                                    >
                                        {fileList.length >= 6 ? null : uploadButton}
                                    </Upload>
                                </Form.Item>
                                <Text type="secondary" className="block">
                                    Tải lên tối đa 6 ảnh. Định dạng: JPG, PNG
                                </Text>
                            </Card>

                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                loading={loading}
                            >
                                Cập nhật sản phẩm
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </Card>
    );
};

export default ProductDetail;
