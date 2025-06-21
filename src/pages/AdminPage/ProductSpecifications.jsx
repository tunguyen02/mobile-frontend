import { Form, Input, Button, Spin, Row, Col, Card, Typography, Divider } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import productDetailService from "../../services/productDetailService";
import productService from "../../services/productService";
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProductSpecifications = () => {
    const { productId } = useParams();
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [form] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch product details to get the name
                const productData = await productService.getProductById(productId);
                if (productData && productData.product) {
                    setProductName(productData.product.name);
                }

                // Fetch specifications
                const specifications = await productDetailService.getProductDetail(productId);
                if (specifications) {
                    form.setFieldsValue(specifications.data);
                }
            } catch (error) {
                console.error('Error fetching product data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await productDetailService.updateProductDetail(productId, values);
            navigate(`/admin/products/detail/${productId}`);
        } catch (error) {
            console.error('Error updating product specifications:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-md">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <Title level={4} className="mb-0">
                        Thông số kỹ thuật sản phẩm {productName && `- ${productName}`}
                    </Title>
                </div>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(`/admin/products/detail/${productId}`)}
                >
                    Quay lại
                </Button>
            </div>

            <Text type="secondary" className="mb-4 block">Cập nhật thông số kỹ thuật chi tiết của sản phẩm</Text>

            <Divider className="my-4" />

            <Spin spinning={loading} tip="Đang xử lý...">
                <Form
                    form={form}
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12} lg={6}>
                            <Card title={<Text strong>Thông số kỹ thuật</Text>} className="mb-4 h-full shadow-sm">
                                <Form.Item label="Hệ điều hành" name={['specifications', 'os']}>
                                    <Input placeholder="Ví dụ: iOS 16" />
                                </Form.Item>
                                <Form.Item label="CPU" name={['specifications', 'cpu']}>
                                    <Input placeholder="Ví dụ: Apple A15 Bionic" />
                                </Form.Item>
                                <Form.Item label="GPU" name={['specifications', 'gpu']}>
                                    <Input placeholder="Ví dụ: Apple GPU 5 nhân" />
                                </Form.Item>
                                <Form.Item label="RAM" name={['specifications', 'ram']}>
                                    <Input placeholder="Ví dụ: 6GB" />
                                </Form.Item>
                                <Form.Item label="Bộ nhớ" name={['specifications', 'storage']}>
                                    <Input placeholder="Ví dụ: 128GB" />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} md={12} lg={6}>
                            <Card title={<Text strong>Camera và Hiển thị</Text>} className="mb-4 h-full shadow-sm">
                                <Form.Item label="Camera trước" name={['cameraDisplay', 'frontCamera']}>
                                    <Input placeholder="Ví dụ: 12MP" />
                                </Form.Item>
                                <Form.Item label="Camera sau" name={['cameraDisplay', 'backCamera']}>
                                    <Input placeholder="Ví dụ: 48MP, 12MP, 12MP" />
                                </Form.Item>
                                <Form.Item label="Công nghệ màn hình" name={['cameraDisplay', 'displayTech']}>
                                    <Input placeholder="Ví dụ: OLED" />
                                </Form.Item>
                                <Form.Item label="Độ phân giải màn hình" name={['cameraDisplay', 'displayResolution']}>
                                    <Input placeholder="Ví dụ: 2556 x 1179 pixels" />
                                </Form.Item>
                                <Form.Item label="Độ sáng màn hình" name={['cameraDisplay', 'displayBrightness']}>
                                    <Input placeholder="Ví dụ: 1600 nits" />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} md={12} lg={6}>
                            <Card title={<Text strong>Thiết kế và Chất liệu</Text>} className="mb-4 h-full shadow-sm">
                                <Form.Item label="Thiết kế" name={['designMaterial', 'design']}>
                                    <Input placeholder="Ví dụ: Nguyên khối" />
                                </Form.Item>
                                <Form.Item label="Chất liệu" name={['designMaterial', 'material']}>
                                    <Input placeholder="Ví dụ: Khung thép không gỉ" />
                                </Form.Item>
                                <Form.Item label="Kích thước và trọng lượng" name={['designMaterial', 'sizeWeight']}>
                                    <Input placeholder="Ví dụ: 147.6 x 71.6 x 7.8 mm, 240g" />
                                </Form.Item>
                                <Form.Item label="Ngày phát hành" name={['designMaterial', 'releaseDate']}>
                                    <Input placeholder="Ví dụ: 09/2023" />
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} md={12} lg={6}>
                            <Card title={<Text strong>Pin và Adapter</Text>} className="mb-4 h-full shadow-sm">
                                <Form.Item label="Dung lượng pin" name={['pinAdapter', 'pinCapacity']}>
                                    <Input placeholder="Ví dụ: 4323 mAh" />
                                </Form.Item>
                                <Form.Item label="Loại pin" name={['pinAdapter', 'pinType']}>
                                    <Input placeholder="Ví dụ: Li-Ion" />
                                </Form.Item>
                                <Form.Item label="Công suất tối đa" name={['pinAdapter', 'maxAdapterPower']}>
                                    <Input placeholder="Ví dụ: 20W" />
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    <div className="mt-4 text-right">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            loading={loading}
                            size="large"
                        >
                            Lưu thông số
                        </Button>
                    </div>
                </Form>
            </Spin>
        </Card>
    );
};

export default ProductSpecifications;
