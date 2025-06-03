import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Empty, Typography, Spin, Select, Input, Checkbox, Form, InputNumber, notification, message, Modal } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, ShoppingCartOutlined, SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import productService from '../../services/productService';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../../redux/cartSlice';
import cartService from '../../services/cartService';
import { handleGetAccessToken } from '../../services/axiosJWT';
import { useMutation } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { Option } = Select;
const CheckboxGroup = Checkbox.Group;

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

// CSS cho Select components
const selectStyles = {
    width: '100%',
    '.ant-select-selector': {
        backgroundColor: '#1e293b !important',
        borderColor: '#475569 !important',
        color: 'white !important'
    },
    '.ant-select-selection-item': {
        color: 'white !important'
    },
    '.ant-select-arrow': {
        color: 'white !important'
    },
    '.ant-select-selection-placeholder': {
        color: '#94a3b8 !important'
    }
};

const ProductComparisonPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [fixedProductId, setFixedProductId] = useState(null);
    const [compareProductId, setCompareProductId] = useState(null);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loginModalVisible, setLoginModalVisible] = useState(false);

    // Trạng thái cho phần tìm kiếm theo tiêu chí
    const [selectedCriteria, setSelectedCriteria] = useState(['price']);
    const [priceValue, setPriceValue] = useState('');
    const [cameraSpec, setCameraSpec] = useState('');
    const [batteryCapacity, setBatteryCapacity] = useState('');
    const [productSeries, setProductSeries] = useState('');
    const [storageValue, setStorageValue] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Danh sách các giá trị từ API
    const [cameraOptions, setCameraOptions] = useState([]);
    const [batteryOptions, setBatteryOptions] = useState([]);
    const [storageOptions, setStorageOptions] = useState([]);
    const [seriesOptions, setSeriesOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const criteriaOptions = [
        { label: 'Giá', value: 'price' },
        { label: 'Camera', value: 'camera' },
        { label: 'Pin', value: 'battery' },
        { label: 'Loại sản phẩm', value: 'series' },
        { label: 'Dung lượng', value: 'storage' }
    ];

    // Mutation cho việc thêm vào giỏ hàng
    const mutationAddToCart = useMutation({
        mutationFn: (product) => {
            const accessToken = handleGetAccessToken();
            // Xác định giá hiện tại dựa trên flash sale hoặc sale thường
            const isOnSale = product.isFlashSale || product.isOnSale;

            // Nếu sản phẩm đang trong flash sale
            if (product.isFlashSale) {
                return cartService.addFlashSaleProductToCart(
                    accessToken,
                    product._id,
                    product.flashSaleId,
                    product.isFlashSale ? product.price : product.originalPrice
                );
            }
            // Ngược lại thêm bình thường
            return cartService.addProductToCart(accessToken, product._id);
        },
        onSuccess: (data) => {
            message.success(data?.message, 3);
            dispatch(setCart(data?.cart));
        },
        onError: (error) => {
            message.error("Thêm sản phẩm thất bại", 3);
        }
    });

    // Lấy thông tin sản phẩm từ URL params
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const fixedId = searchParams.get('fixedId');
        const compareId = searchParams.get('compareId');

        // Thiết lập sản phẩm cố định
        if (fixedId) {
            setFixedProductId(fixedId);

            // Nếu có cả sản phẩm cố định và sản phẩm so sánh, thực hiện so sánh
            if (compareId) {
                setCompareProductId(compareId);
                fetchProductsForComparison([fixedId, compareId]);
            } else {
                // Nếu chỉ có sản phẩm cố định, lấy thông tin sản phẩm đó
                fetchSingleProduct(fixedId);
            }
        } else {
            setLoading(false);
            setError('Không có sản phẩm nào được chọn để so sánh');
        }

        // Lấy danh sách sản phẩm có sẵn để so sánh
        fetchAvailableProducts();
    }, [location.search]);

    // Hàm lấy thông tin của một sản phẩm
    const fetchSingleProduct = async (productId) => {
        try {
            setLoading(true);
            // Lấy thông tin cơ bản của sản phẩm
            const response = await productService.getProductById(productId);

            if (response && response.product) {
                // Lấy thông tin chi tiết của sản phẩm
                try {
                    const detailResponse = await productService.getProductDetail(productId);
                    if (detailResponse && detailResponse.data) {
                        // Kết hợp thông tin sản phẩm và chi tiết
                        const productWithDetails = {
                            ...response.product,
                            details: detailResponse.data
                        };
                        setProducts([productWithDetails]);
                    } else {
                        // Nếu không có chi tiết, chỉ lấy thông tin cơ bản
                        setProducts([response.product]);
                    }
                } catch (detailError) {
                    console.error('Lỗi khi lấy chi tiết sản phẩm:', detailError);
                    setProducts([response.product]);
                }
            } else {
                setError('Không thể lấy thông tin sản phẩm');
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
            setError('Đã xảy ra lỗi khi lấy thông tin sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    // Hàm lấy danh sách sản phẩm để so sánh
    const fetchProductsForComparison = async (ids) => {
        try {
            setLoading(true);
            console.log("Gọi API so sánh với ids:", ids);

            if (!ids || ids.length === 0) {
                setError('Không có sản phẩm nào để so sánh');
                setLoading(false);
                return;
            }

            // Gọi API compareProducts để lấy thông tin sản phẩm và chi tiết đi kèm
            const response = await productService.compareProducts(ids);

            if (response.success && response.data) {
                console.log("Kết quả từ API so sánh:", response.data);
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
            } else {
                console.error("API không trả về danh sách sản phẩm");
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        }
    };

    // Hàm thay đổi sản phẩm so sánh
    const handleCompareProductChange = (productId) => {
        if (!fixedProductId) {
            notification.error({
                message: 'Lỗi',
                description: 'Không có sản phẩm cố định để so sánh'
            });
            return;
        }

        // Xây dựng lại URL với sản phẩm so sánh mới
        const currentUrl = new URL(window.location.href);
        const searchParams = new URLSearchParams(currentUrl.search);
        searchParams.set('compareId', productId);

        // Giữ nguyên các tham số khác
        const newUrl = `/product/compare?${searchParams.toString()}`;
        navigate(newUrl);
    };

    // Hàm thêm sản phẩm vào giỏ hàng
    const handleAddToCart = (product) => {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        if (!user) {
            setSelectedProduct(product);
            setLoginModalVisible(true);
            return;
        }

        // Gọi mutation để thêm vào giỏ hàng
        mutationAddToCart.mutate(product);
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

    // Xác định sản phẩm cố định và sản phẩm so sánh (nếu có)
    const fixedProduct = fixedProductId ? products.find(p => p._id === fixedProductId) : products[0];
    const compareProduct = compareProductId ? products.find(p => p._id === compareProductId) : null;

    // Danh sách sản phẩm để hiển thị (1 hoặc 2 sản phẩm)
    const displayProducts = compareProduct ? [fixedProduct, compareProduct] : [fixedProduct];

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
                <h2 className="text-white text-2xl font-bold m-0">So sánh sản phẩm</h2>
                <div>
                    <Select
                        placeholder="Chọn sản phẩm để so sánh"
                        style={{ ...selectStyles, width: 250 }}
                        onChange={handleCompareProductChange}
                        value={compareProductId}
                        dropdownStyle={{
                            background: '#1f2937',
                            color: 'white'
                        }}
                        optionLabelProp="label"
                    >
                        {availableProducts
                            .filter(p => p._id !== fixedProductId)
                            .map(product => (
                                <Option
                                    key={product._id}
                                    value={product._id}
                                    className="text-white hover:bg-gray-700"
                                    label={product.name}
                                >
                                    <div className="flex items-center justify-between text-white">
                                        <div>{product.name}</div>
                                        {(product.isOnSale || product.isFlashSale) && (
                                            <div className="text-sm text-red-500 font-medium ml-2">
                                                {product.price?.toLocaleString('vi-VN')}₫
                                                <span className="ml-1 text-xs text-gray-400 line-through">
                                                    {product.originalPrice?.toLocaleString('vi-VN')}₫
                                                </span>
                                                {product.isFlashSale && <span className="ml-1 text-yellow-500">⚡</span>}
                                            </div>
                                        )}
                                    </div>
                                </Option>
                            ))}
                    </Select>
                </div>
            </div>

            {/* Phần hiển thị sản phẩm */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {displayProducts.map(product => (
                    <div key={product._id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/10 transition-all">
                        {/* Phần ảnh sản phẩm */}
                        <div className="p-4 bg-gray-800 flex justify-center items-center h-40 relative">
                            <img
                                src={product.imageUrl && product.imageUrl.length > 0 ? product.imageUrl[0] : 'https://placeholder.com/300'}
                                alt={product.name}
                                className="max-h-full max-w-[120px] object-contain"
                            />

                            {/* Tag sale nếu sản phẩm đang giảm giá */}
                            {product.isOnSale && product.discountPercent > 0 && (
                                <div className={`absolute top-2 left-2 ${product.isFlashSale ? 'bg-yellow-600' : 'bg-red-600'} text-white rounded-full px-3 py-1 text-sm font-bold shadow-lg transform rotate-[-5deg] ${product.isFlashSale ? 'animate-pulse' : ''}`}>
                                    {product.isFlashSale && <span className="mr-1">⚡</span>}
                                    -{product.discountPercent}%
                                </div>
                            )}
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
                                {product.isOnSale && product.discountPercent > 0 ? (
                                    <>
                                        {product.price?.toLocaleString('vi-VN')}₫
                                        <span className="text-sm text-gray-400 line-through ml-2">
                                            {product.originalPrice ?
                                                Math.round(product.originalPrice).toLocaleString('vi-VN') :
                                                (product.price / (1 - product.discountPercent / 100)).toFixed(0).toLocaleString('vi-VN')}₫
                                        </span>
                                        {product.isFlashSale && (
                                            <span className="ml-2 text-xs text-yellow-500 font-bold">FLASH SALE</span>
                                        )}
                                    </>
                                ) : (
                                    <>{product.price?.toLocaleString('vi-VN')}₫</>
                                )}
                            </div>
                            <div className="text-sm text-gray-300">
                                {product.color}
                            </div>
                        </div>

                        {/* Phần nút thao tác */}
                        <div className="flex border-t border-gray-700">
                            <button
                                className={`flex-1 ${mutationAddToCart.isPending && mutationAddToCart.variables?._id === product._id ? 'bg-blue-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 transition-colors flex items-center justify-center`}
                                onClick={() => handleAddToCart(product)}
                                disabled={mutationAddToCart.isPending && mutationAddToCart.variables?._id === product._id}
                            >
                                {mutationAddToCart.isPending && mutationAddToCart.variables?._id === product._id ? (
                                    <LoadingOutlined className="mr-1" />
                                ) : (
                                    <ShoppingCartOutlined className="mr-1" />
                                )}
                                <span>Thêm vào giỏ</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bảng so sánh chi tiết */}
            {displayProducts.length > 1 && (
                <>
                    <div className="flex mb-8 items-center justify-center">
                        <h2 className="text-white text-2xl font-bold">Chi tiết so sánh</h2>
                    </div>

                    <div className="overflow-x-auto max-w-5xl mx-auto">
                        <table className="min-w-full bg-gray-800 border border-gray-700 text-white">
                            <thead>
                                <tr className="bg-gray-700">
                                    <th className="border border-gray-600 p-3 w-1/5">
                                        <div className="text-white font-medium">Thông số</div>
                                    </th>
                                    {displayProducts.map(product => (
                                        <th key={product._id} className="border border-gray-600 p-3" style={{ width: `${80 / displayProducts.length}%` }}>
                                            <div className="text-white font-medium">{product.name}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Thông tin cơ bản */}
                                <tr className="bg-gray-700">
                                    <td colSpan={displayProducts.length + 1} className="border border-gray-600 p-3 font-bold">
                                        <div className="text-white font-bold">Thông tin cơ bản</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Giá bán</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.price?.toLocaleString('vi-VN')}₫
                                                {product.originalPrice > product.price && (
                                                    <span className="text-sm text-gray-400 line-through block">
                                                        {product.originalPrice?.toLocaleString('vi-VN')}₫
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Màu sắc</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">{product.color || 'N/A'}</div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Thương hiệu</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">{product.brand?.name || 'N/A'}</div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Cấu hình */}
                                <tr className="bg-gray-700">
                                    <td colSpan={displayProducts.length + 1} className="border border-gray-600 p-3 font-bold">
                                        <div className="text-white font-bold">Cấu hình</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Hệ điều hành</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.specifications?.os || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">CPU</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.specifications?.cpu || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">GPU</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.specifications?.gpu || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">RAM</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.specifications?.ram || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Bộ nhớ trong</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.specifications?.storage ||
                                                    (product.name.includes('GB') ? product.name.split('GB')[0].split(' ').pop() + 'GB' : 'N/A')}
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Màn hình & Camera */}
                                <tr className="bg-gray-700">
                                    <td colSpan={displayProducts.length + 1} className="border border-gray-600 p-3 font-bold">
                                        <div className="text-white font-bold">Màn hình & Camera</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Công nghệ màn hình</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.cameraDisplay?.displayTech || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Độ phân giải</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.cameraDisplay?.displayResolution || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Kích thước màn hình</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.cameraDisplay?.displayWidth || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Độ sáng</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.cameraDisplay?.displayBrightness || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Camera trước</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.cameraDisplay?.frontCamera || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Camera sau</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.cameraDisplay?.backCamera || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Pin & Sạc */}
                                <tr className="bg-gray-700">
                                    <td colSpan={displayProducts.length + 1} className="border border-gray-600 p-3 font-bold">
                                        <div className="text-white font-bold">Pin & Sạc</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Dung lượng pin</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.pinAdapter?.pinCapacity || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Loại pin</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.pinAdapter?.pinType || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Công suất sạc tối đa</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.pinAdapter?.maxAdapterPower || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Thiết kế & Vật liệu */}
                                <tr className="bg-gray-700">
                                    <td colSpan={displayProducts.length + 1} className="border border-gray-600 p-3 font-bold">
                                        <div className="text-white font-bold">Thiết kế & Vật liệu</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Thiết kế</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.designMaterial?.design || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Chất liệu</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.designMaterial?.material || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Kích thước & Trọng lượng</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.designMaterial?.sizeWeight || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="border border-gray-600 p-3">
                                        <div className="text-white">Ngày ra mắt</div>
                                    </td>
                                    {displayProducts.map(product => (
                                        <td key={product._id} className="border border-gray-600 p-3">
                                            <div className="text-white">
                                                {product.details?.designMaterial?.releaseDate || 'N/A'}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal thông báo đăng nhập */}
            <Modal
                title={<div className="text-center text-lg font-bold">Yêu cầu đăng nhập</div>}
                open={loginModalVisible}
                onCancel={() => setLoginModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setLoginModalVisible(false)}>
                        Hủy
                    </Button>,
                    <Button
                        key="login"
                        type="primary"
                        onClick={() => {
                            setLoginModalVisible(false);
                            navigate('/signin', {
                                state: { from: location.pathname + location.search }
                            });
                        }}
                    >
                        Đăng nhập
                    </Button>,
                ]}
                centered
            >
                <div className="py-4 text-center">
                    <div className="text-red-500 text-5xl mb-4">
                        <ShoppingCartOutlined />
                    </div>
                    <p className="mb-2">Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng</p>
                    {selectedProduct && (
                        <p className="font-bold">{selectedProduct.name}</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ProductComparisonPage; 