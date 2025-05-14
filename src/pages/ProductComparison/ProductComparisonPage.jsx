import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Empty, Typography, Spin, Select } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import productService from '../../services/productService';
import { useDispatch } from 'react-redux';
import { setCart } from '../../redux/cartSlice';

const { Title, Text } = Typography;
const { Option } = Select;

// CSS nội tuyến để khắc phục vấn đề màu sắc
const globalSelectStyle = {
    '.ant-select-dropdown': {
        backgroundColor: '#1f2937 !important',
    },
    '.ant-select-item': {
        color: 'white !important',
    },
    '.ant-select-item-option-content': {
        color: 'white !important',
    },
    '.ant-select-item-option-active': {
        backgroundColor: '#374151 !important',
    },
    '.ant-select-item-option-selected': {
        backgroundColor: '#4B5563 !important',
    }
};

const ProductComparisonPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);

    // Lấy danh sách ID sản phẩm từ query params
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const idsParam = searchParams.get('ids');
        if (idsParam) {
            const ids = idsParam.split(',');
            setSelectedProductIds(ids);
            fetchProductsForComparison(ids);
        } else {
            setLoading(false);
            setError('Không có sản phẩm nào được chọn để so sánh');
        }

        // Lấy danh sách sản phẩm khác để thêm vào so sánh
        fetchAvailableProducts();
    }, [location.search]);

    // Thêm style toàn cục khi component được mount
    useEffect(() => {
        // Thêm style toàn cục
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            .ant-select-dropdown {
                background-color: #1f2937 !important;
            }
            .ant-select-item {
                color: white !important;
            }
            .ant-select-item-option-content {
                color: white !important;
            }
            .ant-select-item-option-active {
                background-color: #374151 !important;
            }
            .ant-select-item-option-selected {
                background-color: #4B5563 !important;
            }
            .ant-select-selection-placeholder {
                color: rgba(255, 255, 255, 0.85) !important;
            }
            .ant-select-selection-item {
                color: white !important;
            }
            .ant-select-selector {
                color: white !important;
            }
            .ant-typography {
                color: white !important;
            }
            .comparison-select .ant-select-selector {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
            }
            .comparison-select .ant-select-selection-placeholder {
                color: white !important;
            }
            h2.ant-typography, h3.ant-typography {
                color: white !important;
            }
        `;
        document.head.appendChild(styleTag);

        // Cleanup khi component unmount
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);

    // Hàm lấy danh sách sản phẩm so sánh
    const fetchProductsForComparison = async (ids) => {
        try {
            setLoading(true);
            const response = await productService.compareProducts(ids);
            if (response.success && response.data) {
                setProducts(response.data);
            } else {
                setError('Không thể lấy thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu so sánh:', error);
            setError('Đã xảy ra lỗi khi so sánh sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách sản phẩm khác để thêm vào so sánh
    const fetchAvailableProducts = async () => {
        try {
            const response = await productService.getAllProducts();
            if (response && response.products) {
                setAvailableProducts(response.products);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        }
    };

    // Hàm thêm sản phẩm vào so sánh
    const handleAddProductToCompare = (productId) => {
        if (selectedProductIds.length >= 4) {
            alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm');
            return;
        }

        const newIds = [...selectedProductIds, productId];
        setSelectedProductIds(newIds);
        navigate(`/product/compare?ids=${newIds.join(',')}`);
    };

    // Hàm xóa sản phẩm khỏi danh sách so sánh
    const handleRemoveProduct = (productId) => {
        const newIds = selectedProductIds.filter(id => id !== productId);
        if (newIds.length < 2) {
            // Quay lại trang trước nếu còn ít hơn 2 sản phẩm
            navigate(-1);
            return;
        }
        setSelectedProductIds(newIds);
        navigate(`/product/compare?ids=${newIds.join(',')}`);
    };

    // Hàm thêm sản phẩm vào giỏ hàng
    const handleAddToCart = async (product) => {
        try {
            const cartData = {
                productId: product._id,
                name: product.name,
                amount: 1,
                image: product.imageUrl && product.imageUrl.length > 0 ? product.imageUrl[0] : '',
                price: product.price,
                countInStock: product.countInStock
            };

            dispatch(setCart({ cartData }));
            alert(`Đã thêm sản phẩm ${product.name} vào giỏ hàng`);
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
        }
    };

    // Render khi đang tải
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <Spin size="large" className="text-white" />
            </div>
        );
    }

    // Render khi có lỗi
    if (error) {
        return (
            <div className="container mx-auto p-4 bg-gray-900 min-h-screen">
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    Quay lại
                </Button>
                <Empty
                    description={<span className="text-white">{error}</span>}
                    className="my-8"
                />
            </div>
        );
    }

    // Kiểm tra nếu không có sản phẩm
    if (!products || products.length === 0) {
        return (
            <div className="container mx-auto p-4 bg-gray-900 min-h-screen">
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    Quay lại
                </Button>
                <Empty
                    description={<span className="text-white">Không có sản phẩm nào để so sánh</span>}
                    className="my-8"
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    Quay lại
                </Button>
                <Title level={2} className="m-0 text-white">So sánh sản phẩm</Title>
                <div>
                    <Select
                        placeholder="Thêm sản phẩm để so sánh"
                        style={{ width: 250 }}
                        onChange={handleAddProductToCompare}
                        disabled={selectedProductIds.length >= 4}
                        className="text-white comparison-select"
                        dropdownStyle={{
                            background: '#1f2937',
                            color: 'white'
                        }}
                        optionLabelProp="label"
                    >
                        {availableProducts
                            .filter(p => !selectedProductIds.includes(p._id))
                            .map(product => (
                                <Option
                                    key={product._id}
                                    value={product._id}
                                    className="text-white hover:bg-gray-700"
                                    label={product.name}
                                >
                                    <div className="text-white">{product.name}</div>
                                </Option>
                            ))}
                    </Select>
                </div>
            </div>

            {/* Phần hiển thị sản phẩm */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {products.map(product => (
                    <div key={product._id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/10 transition-all">
                        {/* Phần ảnh sản phẩm */}
                        <div className="p-4 bg-gray-800 flex justify-center items-center h-64">
                            <img
                                src={product.imageUrl && product.imageUrl.length > 0 ? product.imageUrl[0] : 'https://placeholder.com/300'}
                                alt={product.name}
                                className="max-h-full object-contain"
                            />
                        </div>

                        {/* Phần thông tin sản phẩm */}
                        <div className="p-4 border-t border-gray-700">
                            <a
                                href={`/product/product-details/${product._id}`}
                                className="text-lg font-medium text-white hover:text-blue-400 block mb-2"
                            >
                                {product.name}
                            </a>
                            <div className="text-lg font-bold text-red-500 mb-1">
                                {product.price.toLocaleString('vi-VN')}₫
                            </div>
                            <div className="text-sm text-gray-300">
                                {product.color}
                            </div>
                        </div>

                        {/* Phần nút thao tác */}
                        <div className="flex border-t border-gray-700">
                            <button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 transition-colors flex items-center justify-center"
                                onClick={() => handleAddToCart(product)}
                            >
                                <ShoppingCartOutlined className="mr-1" />
                                <span>Thêm vào giỏ</span>
                            </button>
                            <button
                                className={`flex-1 border-l border-gray-700 py-2 px-4 flex items-center justify-center transition-colors ${selectedProductIds.length <= 2
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                onClick={() => handleRemoveProduct(product._id)}
                                disabled={selectedProductIds.length <= 2}
                            >
                                <DeleteOutlined className="mr-1" />
                                <span>Xóa</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bảng so sánh chi tiết */}
            <Title level={3} className="mb-4 text-white font-bold">Chi tiết so sánh</Title>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 border border-gray-700">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="border border-gray-600 p-3 w-1/5 text-white">Thông số</th>
                            {products.map(product => (
                                <th key={product._id} className="border border-gray-600 p-3 text-white">
                                    {product.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Thông tin cơ bản */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold text-white">
                                Thông tin cơ bản
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Giá bán</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.price.toLocaleString('vi-VN')}₫
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Màu sắc</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.color}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Thương hiệu</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.brand?.name || 'N/A'}
                                </td>
                            ))}
                        </tr>

                        {/* Cấu hình */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold text-white">
                                Cấu hình
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Hệ điều hành</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.specifications?.os || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">CPU</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.specifications?.cpu || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">GPU</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.specifications?.gpu || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">RAM</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.specifications?.ram || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Bộ nhớ</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.specifications?.storage || 'N/A'}
                                </td>
                            ))}
                        </tr>

                        {/* Camera và màn hình */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold text-white">
                                Camera và màn hình
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Camera trước</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.cameraDisplay?.frontCamera || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Camera sau</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.cameraDisplay?.backCamera || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Công nghệ màn hình</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.cameraDisplay?.displayTech || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Độ phân giải màn hình</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.cameraDisplay?.displayResolution || 'N/A'}
                                </td>
                            ))}
                        </tr>

                        {/* Pin và sạc */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold text-white">
                                Pin và sạc
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Dung lượng pin</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.pinAdapter?.pinCapacity || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Loại pin</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.pinAdapter?.pinType || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Công suất sạc tối đa</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.pinAdapter?.maxAdapterPower || 'N/A'}
                                </td>
                            ))}
                        </tr>

                        {/* Thiết kế và vật liệu */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold text-white">
                                Thiết kế và vật liệu
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Kiểu thiết kế</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.designMaterial?.design || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Chất liệu</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.designMaterial?.material || 'N/A'}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3 text-gray-300">Kích thước và trọng lượng</td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3 text-gray-300">
                                    {product.details?.designMaterial?.sizeWeight || 'N/A'}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductComparisonPage; 