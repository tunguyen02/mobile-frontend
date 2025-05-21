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
    const [selectedProductIds, setSelectedProductIds] = useState([]);
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
            message.success({
                content: (
                    <div className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <div>
                            <div className="font-bold">Thêm vào giỏ hàng thành công</div>
                            <div className="text-sm">Sản phẩm đã được thêm vào giỏ hàng</div>
                        </div>
                    </div>
                ),
                style: {
                    marginTop: '10vh',
                },
                duration: 3
            });
            dispatch(setCart(data?.cart));
        },
        onError: (error) => {
            message.error({
                content: (
                    <div className="flex items-center">
                        <span className="text-red-500 mr-2">✗</span>
                        <div>
                            <div className="font-bold">Thêm vào giỏ hàng thất bại</div>
                            <div className="text-sm">Không thể thêm sản phẩm vào giỏ hàng</div>
                        </div>
                    </div>
                ),
                style: {
                    marginTop: '10vh',
                },
                duration: 3
            });
        }
    });

    // Lấy danh sách ID sản phẩm từ query params - đơn giản hóa
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const idsParam = searchParams.get('ids');
        const priceParam = searchParams.get('price');
        const discountParam = searchParams.get('discount');

        // Nếu có tham số giá, tự động điền vào trường giá
        if (priceParam) {
            const priceValue = parseInt(priceParam);
            setPriceValue(priceValue);
            console.log("Đã nhận giá từ tham số URL:", priceValue);

            // Đảm bảo tiêu chí giá được chọn
            if (!selectedCriteria.includes('price')) {
                setSelectedCriteria([...selectedCriteria, 'price']);
            }

            // Nếu không có ID sản phẩm, tự động tìm kiếm theo giá
            if (!idsParam) {
                console.log("Không có ID sản phẩm, tự động tìm kiếm theo giá:", priceValue);
                // Đợi một chút để đảm bảo các state đã được cập nhật
                setTimeout(() => {
                    handleAutoSearchByPrice(priceValue);
                }, 800);
            }
        }

        if (idsParam) {
            const ids = idsParam.split(',');
            setSelectedProductIds(ids);
            fetchProductsForComparison(ids);
        } else {
            setLoading(false);
            if (!priceParam) {
                setError('Không có sản phẩm nào được chọn để so sánh');
            }
        }

        // Lấy danh sách sản phẩm khác để thêm vào so sánh
        fetchAvailableProducts();

        // Lấy danh sách các giá trị từ API
        fetchOptionValues();
    }, [location.search]);

    // Hàm lấy danh sách sản phẩm so sánh - đơn giản hóa
    const fetchProductsForComparison = async (ids) => {
        try {
            setLoading(true);
            const response = await productService.compareProducts(ids);

            if (response.success && response.data) {
                // Log thông tin chi tiết sản phẩm để debug
                console.log("Thông tin sản phẩm chi tiết:", response.data);
                // Kiểm tra thông tin màn hình
                response.data.forEach(product => {
                    console.log(`Sản phẩm ${product.name} - Thông tin màn hình:`,
                        product.details?.cameraDisplay,
                        "Kích thước và trọng lượng:",
                        product.details?.designMaterial?.sizeWeight);
                });

                // Không sử dụng localStorage nữa
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
                // Không sử dụng localStorage nữa
                setAvailableProducts(response.products);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        }
    };

    // Hàm lấy các giá trị từ API
    const fetchOptionValues = async () => {
        setLoadingOptions(true);
        try {
            // Lấy danh sách thông số camera
            const cameraResponse = await productService.getDistinctCameraSpecs();
            if (cameraResponse.success && cameraResponse.data) {
                setCameraOptions(cameraResponse.data);
            }

            // Lấy danh sách dung lượng pin
            const batteryResponse = await productService.getDistinctBatteryCapacities();
            if (batteryResponse.success && batteryResponse.data) {
                setBatteryOptions(batteryResponse.data);
            }

            // Lấy danh sách dung lượng bộ nhớ
            const storageResponse = await productService.getDistinctStorageOptions();
            if (storageResponse.success && storageResponse.data) {
                setStorageOptions(storageResponse.data);
            }

            // Lấy danh sách loại sản phẩm
            const seriesResponse = await productService.getDistinctProductSeries();
            if (seriesResponse.success && seriesResponse.data) {
                setSeriesOptions(seriesResponse.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách các giá trị:', error);
        } finally {
            setLoadingOptions(false);
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

    // Hàm tự động tìm kiếm theo giá khi chuyển từ trang chi tiết
    const handleAutoSearchByPrice = async (price) => {
        try {
            setSearchLoading(true);
            console.log("Đang tự động tìm kiếm với giá:", price);

            if (!price || isNaN(price)) {
                console.error("Giá trị giá không hợp lệ:", price);
                setError('Giá sản phẩm không hợp lệ');
                setSearchLoading(false);
                return;
            }

            // Sử dụng range lớn hơn (5.000.000 VNĐ) và limit lớn hơn (8 sản phẩm) để có nhiều kết quả hơn
            const range = 6000000; // Khoảng giá ± 6 triệu
            const limit = 8; // Tìm tối đa 8 sản phẩm để lọc ra 4 sản phẩm phù hợp nhất

            const response = await productService.findProductsByPrice(price, range, limit);
            console.log("Kết quả tìm kiếm tự động:", response);

            // Hàm lấy productIds từ response
            const getIds = (response) => {
                if (response && response.success && response.data && response.data.length > 0) {
                    return response.data.map(product => product._id);
                }
                return [];
            };

            const productIds = getIds(response);

            if (productIds.length === 0) {
                setError('Không tìm thấy sản phẩm phù hợp với giá đã chọn');
                setSearchLoading(false);
                return;
            }

            // Giới hạn số lượng sản phẩm (tối đa 4)
            const limitedIds = productIds.slice(0, 4);

            // Cập nhật URL với danh sách ID sản phẩm mới tìm được
            navigate(`/product/compare?ids=${limitedIds.join(',')}`);

            // Lấy thông tin chi tiết của các sản phẩm vừa tìm thấy
            fetchProductsForComparison(limitedIds);

            // Cập nhật danh sách ID sản phẩm đã chọn
            setSelectedProductIds(limitedIds);

            // Thông báo thành công
            notification.success({
                message: 'Tìm kiếm thành công',
                description: `Đã tìm thấy ${limitedIds.length} sản phẩm phù hợp với khoảng giá ${priceValue.toLocaleString('vi-VN')}₫`
            });
        } catch (error) {
            console.error("Lỗi khi tự động tìm kiếm:", error);
            setError('Đã xảy ra lỗi khi tìm kiếm sản phẩm theo giá');
        } finally {
            setSearchLoading(false);
        }
    };

    // Hàm tìm sản phẩm theo tiêu chí - đơn giản hóa
    const handleSearchByCriteria = async () => {
        try {
            setSearchLoading(true);

            // Kiểm tra nếu không có tiêu chí được chọn
            if (selectedCriteria.length === 0) {
                notification.error({ message: 'Vui lòng chọn ít nhất một tiêu chí tìm kiếm' });
                setSearchLoading(false);
                return;
            }

            // Kiểm tra xem có ít nhất một tiêu chí có dữ liệu
            const hasPrice = selectedCriteria.includes('price') && priceValue;
            const hasCamera = selectedCriteria.includes('camera') && cameraSpec;
            const hasBattery = selectedCriteria.includes('battery') && batteryCapacity;
            const hasSeries = selectedCriteria.includes('series') && productSeries;
            const hasStorage = selectedCriteria.includes('storage') && storageValue;

            if (!hasPrice && !hasCamera && !hasBattery && !hasSeries && !hasStorage) {
                notification.error({
                    message: 'Vui lòng nhập dữ liệu cho ít nhất một tiêu chí đã chọn'
                });
                setSearchLoading(false);
                return;
            }

            let hasValidCriteria = false;
            let results = [];

            // Hàm lấy productIds từ response
            const getProductIds = (response) => {
                if (response && response.success && response.data && response.data.length > 0) {
                    return response.data.map(product => product._id);
                }
                return [];
            };

            // Tìm kiếm theo giá
            if (hasPrice) {
                try {
                    // Sử dụng range lớn hơn (6.000.000 VNĐ) để có nhiều kết quả hơn
                    const range = 6000000; // Khoảng giá ± 6 triệu
                    const limit = 8; // Tìm tối đa 8 sản phẩm để lọc ra những sản phẩm phù hợp nhất

                    const response = await productService.findProductsByPrice(priceValue, range, limit);
                    const ids = getProductIds(response);
                    if (ids.length > 0) {
                        hasValidCriteria = true;
                        results.push(...ids);
                    }
                } catch (error) {
                    console.error('Lỗi khi tìm theo giá:', error);
                }
            }

            // Tìm kiếm theo camera
            if (hasCamera) {
                try {
                    const response = await productService.findProductsByCamera(cameraSpec);
                    const ids = getProductIds(response);
                    if (ids.length > 0) {
                        hasValidCriteria = true;
                        results.push(...ids);
                    }
                } catch (error) {
                    console.error('Lỗi khi tìm theo camera:', error);
                }
            }

            // Tìm kiếm theo pin
            if (hasBattery) {
                try {
                    const response = await productService.findProductsByBattery(batteryCapacity);
                    const ids = getProductIds(response);
                    if (ids.length > 0) {
                        hasValidCriteria = true;
                        results.push(...ids);
                    }
                } catch (error) {
                    console.error('Lỗi khi tìm theo pin:', error);
                }
            }

            // Tìm kiếm theo loại sản phẩm
            if (hasSeries) {
                try {
                    const response = await productService.findProductsBySeries(productSeries);
                    const ids = getProductIds(response);
                    if (ids.length > 0) {
                        hasValidCriteria = true;
                        results.push(...ids);
                    }
                } catch (error) {
                    console.error('Lỗi khi tìm theo loại sản phẩm:', error);
                }
            }

            // Tìm kiếm theo dung lượng
            if (hasStorage) {
                try {
                    const response = await productService.findProductsByStorage(storageValue);
                    const ids = getProductIds(response);
                    if (ids.length > 0) {
                        hasValidCriteria = true;
                        results.push(...ids);
                    }
                } catch (error) {
                    console.error('Lỗi khi tìm theo dung lượng:', error);
                }
            }

            // Kiểm tra nếu không có tiêu chí hợp lệ nào được nhập
            if (!hasValidCriteria) {
                notification.warning({
                    message: 'Không tìm thấy sản phẩm',
                    description: 'Không tìm thấy sản phẩm phù hợp với các tiêu chí đã chọn'
                });
                setSearchLoading(false);
                return;
            }

            // Loại bỏ các ID trùng lặp
            const uniqueProductIds = [...new Set(results)];

            if (uniqueProductIds.length === 0) {
                notification.warning({
                    message: 'Không tìm thấy sản phẩm',
                    description: 'Không tìm thấy sản phẩm phù hợp với các tiêu chí đã chọn'
                });
                setSearchLoading(false);
                return;
            }

            // Giới hạn số lượng sản phẩm (tối đa 4)
            const limitedIds = uniqueProductIds.slice(0, 4);

            // Cập nhật URL với danh sách ID sản phẩm mới tìm được
            navigate(`/product/compare?ids=${limitedIds.join(',')}`);

            // Lấy thông tin chi tiết của các sản phẩm vừa tìm thấy
            fetchProductsForComparison(limitedIds);

            // Cập nhật danh sách ID sản phẩm đã chọn
            setSelectedProductIds(limitedIds);

            // Thông báo thành công
            let message = 'Đã tìm thấy sản phẩm phù hợp với ';
            if (hasPrice) message += `giá ${priceValue.toLocaleString('vi-VN')}₫, `;
            if (hasCamera) message += `camera ${cameraSpec}, `;
            if (hasBattery) message += `pin ${batteryCapacity}, `;
            if (hasSeries) message += `loại ${productSeries}, `;
            if (hasStorage) message += `dung lượng ${storageValue}, `;

            // Loại bỏ dấu phẩy và khoảng trắng cuối cùng
            message = message.trimEnd().slice(0, -1);

            notification.success({
                message: 'Tìm kiếm thành công',
                description: message
            });

        } catch (error) {
            console.error('Lỗi khi tìm kiếm theo tiêu chí:', error);
            setError('Đã xảy ra lỗi khi tìm kiếm sản phẩm');
        } finally {
            setSearchLoading(false);
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
                <h2 className="text-white text-2xl font-bold m-0">So sánh sản phẩm</h2>
                <div>
                    <Select
                        placeholder="Thêm sản phẩm để so sánh"
                        style={{ ...selectStyles, width: 250 }}
                        onChange={handleAddProductToCompare}
                        disabled={selectedProductIds.length >= 4}
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
                                    <div className="flex items-center justify-between text-white">
                                        <div>{product.name}</div>
                                        {(product.isOnSale || product.isFlashSale) && (
                                            <div className="text-sm text-red-500 font-medium ml-2">
                                                {product.price.toLocaleString('vi-VN')}₫
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

            {/* Bộ lọc tìm kiếm theo tiêu chí */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h4 className="text-white text-xl font-bold mb-4">Tìm sản phẩm để so sánh theo tiêu chí</h4>

                <Form layout="vertical">
                    <div className="flex flex-col md:flex-row">
                        {/* Cột bên trái - Tiêu chí */}
                        <div className="md:w-1/4 md:pr-4 mb-4 md:mb-0">
                            <Form.Item label={<span className="text-white font-bold">Tiêu chí</span>}>
                                <CheckboxGroup
                                    options={criteriaOptions.map(option => ({
                                        ...option,
                                        label: <span className="text-white">{option.label}</span>
                                    }))}
                                    value={selectedCriteria}
                                    onChange={(values) => setSelectedCriteria(values)}
                                    className="flex flex-col space-y-2"
                                />
                            </Form.Item>
                        </div>

                        {/* Đường ngăn cách */}
                        <div className="hidden md:block md:w-px bg-gray-600 mx-4"></div>

                        {/* Cột bên phải - Các trường nhập liệu */}
                        <div className="md:w-3/4 md:pl-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {selectedCriteria.includes('price') && (
                                    <Form.Item label={<span className="text-white">Khoảng giá (VNĐ)</span>} className="mb-4">
                                        <InputNumber
                                            value={priceValue}
                                            onChange={value => setPriceValue(value)}
                                            placeholder="Nhập giá"
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                            parser={value => value.replace(/\./g, '')}
                                            style={{ width: '100%', backgroundColor: '#374151', borderColor: '#6B7280', color: 'white' }}
                                        />
                                    </Form.Item>
                                )}

                                {selectedCriteria.includes('camera') && (
                                    <Form.Item label={<span className="text-white">Thông số camera</span>} className="mb-4">
                                        <Select
                                            value={cameraSpec}
                                            onChange={value => setCameraSpec(value)}
                                            placeholder="Chọn thông số camera"
                                            style={selectStyles}
                                            dropdownStyle={{ backgroundColor: '#1f2937', color: 'white' }}
                                            optionLabelProp="label"
                                            optionFilterProp="children"
                                            loading={loadingOptions}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {cameraOptions.map(option => (
                                                <Option key={option} value={option} label={option} className="text-white">
                                                    <span className="text-white">{option}</span>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}

                                {selectedCriteria.includes('battery') && (
                                    <Form.Item label={<span className="text-white">Dung lượng pin</span>} className="mb-4">
                                        <Select
                                            value={batteryCapacity}
                                            onChange={value => setBatteryCapacity(value)}
                                            placeholder="Chọn dung lượng pin"
                                            style={selectStyles}
                                            dropdownStyle={{ backgroundColor: '#1f2937', color: 'white' }}
                                            optionLabelProp="label"
                                            optionFilterProp="children"
                                            loading={loadingOptions}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {batteryOptions.map(option => (
                                                <Option key={option} value={option} label={option} className="text-white">
                                                    <span className="text-white">{option}</span>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}

                                {selectedCriteria.includes('series') && (
                                    <Form.Item label={<span className="text-white">Tên sản phẩm</span>} className="mb-4">
                                        <Select
                                            value={productSeries}
                                            onChange={value => setProductSeries(value)}
                                            placeholder="Chọn loại sản phẩm"
                                            style={selectStyles}
                                            dropdownStyle={{ backgroundColor: '#1f2937', color: 'white' }}
                                            optionLabelProp="label"
                                            optionFilterProp="children"
                                            loading={loadingOptions}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {seriesOptions.map(option => (
                                                <Option key={option} value={option} label={option} className="text-white">
                                                    <span className="text-white">{option}</span>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}

                                {selectedCriteria.includes('storage') && (
                                    <Form.Item label={<span className="text-white">Dung lượng bộ nhớ</span>} className="mb-4">
                                        <Select
                                            value={storageValue}
                                            onChange={value => setStorageValue(value)}
                                            placeholder="Chọn dung lượng bộ nhớ"
                                            style={selectStyles}
                                            dropdownStyle={{ backgroundColor: '#1f2937', color: 'white' }}
                                            optionLabelProp="label"
                                            optionFilterProp="children"
                                            loading={loadingOptions}
                                            filterOption={(input, option) =>
                                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {storageOptions.map(option => (
                                                <Option key={option} value={option} label={option} className="text-white">
                                                    <span className="text-white">{option}</span>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    icon={<SearchOutlined />}
                                    onClick={handleSearchByCriteria}
                                    loading={searchLoading}
                                    className="bg-blue-500 hover:bg-blue-600 border-blue-500"
                                >
                                    <span className="text-white">Tìm sản phẩm</span>
                                </Button>
                            </Form.Item>
                        </div>
                    </div>
                </Form>
            </div>

            {/* Phần hiển thị sản phẩm */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {products.map(product => (
                    <div key={product._id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/10 transition-all">
                        {/* Phần ảnh sản phẩm */}
                        <div className="p-4 bg-gray-800 flex justify-center items-center h-64 relative">
                            <img
                                src={product.imageUrl && product.imageUrl.length > 0 ? product.imageUrl[0] : 'https://placeholder.com/300'}
                                alt={product.name}
                                className="max-h-full object-contain"
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
                                        {product.price.toLocaleString('vi-VN')}₫
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
                                    <>{product.price.toLocaleString('vi-VN')}₫</>
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
            <div className="flex mb-8 items-center justify-center">
                <h2 className="text-white text-2xl font-bold">Chi tiết so sánh</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 border border-gray-700 text-white">
                    <thead>
                        <tr className="bg-gray-700">
                            <th className="border border-gray-600 p-3 w-1/5">
                                <div className="text-white font-medium">Thông số</div>
                            </th>
                            {products.map(product => (
                                <th key={product._id} className="border border-gray-600 p-3" style={{ width: `${80 / products.length}%` }}>
                                    <div className="text-white font-medium">{product.name}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Thông tin cơ bản */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold">
                                <div className="text-white font-bold">Thông tin cơ bản</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Giá bán</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">
                                        {product.isFlashSale || product.isOnSale ? (
                                            <>
                                                <span className="text-red-500 font-bold">{product.price.toLocaleString('vi-VN')}₫</span>
                                                <br />
                                                <span className="text-sm text-gray-400 line-through">
                                                    {product.originalPrice.toLocaleString('vi-VN')}₫
                                                </span>
                                                {product.isFlashSale && (
                                                    <span className="ml-2 text-xs text-yellow-500 font-bold">⚡</span>
                                                )}
                                            </>
                                        ) : (
                                            product.price.toLocaleString('vi-VN') + '₫'
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Màu sắc</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.color}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Thương hiệu</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.brand?.name || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>

                        {/* Cấu hình */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold">
                                <div className="text-white font-bold">Cấu hình</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Hệ điều hành</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.specifications?.os || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">CPU</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.specifications?.cpu || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">GPU</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.specifications?.gpu || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">RAM</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.specifications?.ram || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Bộ nhớ trong</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.specifications?.storage || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>

                        {/* Camera và màn hình */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold">
                                <div className="text-white font-bold">Camera và màn hình</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Camera trước</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.cameraDisplay?.frontCamera || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Camera sau</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.cameraDisplay?.backCamera || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Công nghệ màn hình</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.cameraDisplay?.displayTech || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Độ phân giải</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.cameraDisplay?.displayResolution || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Kích thước màn hình</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">
                                        {(() => {
                                            // Thử lấy kích thước từ nhiều nguồn khác nhau
                                            const displayInfo = product.details?.cameraDisplay;
                                            const sizeInfo = product.details?.designMaterial?.sizeWeight;

                                            // 1. Kiểm tra trường displayWidth
                                            if (displayInfo?.displayWidth && displayInfo.displayWidth !== "") {
                                                return displayInfo.displayWidth;
                                            }

                                            // 2. Trích xuất từ thông tin độ phân giải nếu có
                                            if (displayInfo?.displayResolution) {
                                                // Thường thông tin độ phân giải có kèm thông tin inch
                                                const inchMatch = displayInfo.displayResolution.match(/(\d+(\.\d+)?)["″]?\s*inch/i);
                                                if (inchMatch) {
                                                    return `${inchMatch[1]}"`; // Trả về kích thước inch
                                                }
                                            }

                                            // 3. Trích xuất từ thông tin kích thước và trọng lượng nếu có
                                            if (sizeInfo) {
                                                const inchMatch = sizeInfo.match(/(\d+(\.\d+)?)["″]?\s*inch/i);
                                                if (inchMatch) {
                                                    return `${inchMatch[1]}"`; // Trả về kích thước inch
                                                }

                                                // Tìm các patterns phổ biến khác cho kích thước màn hình
                                                const displayMatch = sizeInfo.match(/màn\s*hình[:\s]+(\d+(\.\d+)?)/i);
                                                if (displayMatch) {
                                                    return `${displayMatch[1]}"`;
                                                }
                                            }

                                            // 4. Trích xuất từ tên sản phẩm nếu có chứa thông tin kích thước
                                            if (product.name) {
                                                // Phổ biến với định dạng iPhone X (6.1") hoặc tương tự
                                                const nameInchMatch = product.name.match(/\((\d+(\.\d+)?)["″]?\)/);
                                                if (nameInchMatch) {
                                                    return `${nameInchMatch[1]}"`;
                                                }

                                                // Tìm số inch ở cuối tên sản phẩm
                                                const inchEndMatch = product.name.match(/\s(\d+(\.\d+)?)["″]$/);
                                                if (inchEndMatch) {
                                                    return `${inchEndMatch[1]}"`;
                                                }
                                            }

                                            // 5. Giá trị mặc định theo loại sản phẩm nếu có thể xác định từ tên
                                            if (product.name) {
                                                if (product.name.includes("iPhone 16")) return "6.1\"";
                                                if (product.name.includes("iPhone 13")) return "6.1\"";
                                                if (product.name.includes("iPhone 12")) return "6.1\"";
                                                if (product.name.includes("iPhone 11")) return "6.1\"";
                                            }

                                            return 'N/A';
                                        })()}
                                    </div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Độ sáng</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.cameraDisplay?.displayBrightness || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>

                        {/* Pin và sạc */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold">
                                <div className="text-white font-bold">Pin và sạc</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Dung lượng pin</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.pinAdapter?.pinCapacity || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Loại pin</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.pinAdapter?.pinType || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Công suất sạc tối đa</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.pinAdapter?.maxAdapterPower || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>

                        {/* Thiết kế và vật liệu */}
                        <tr className="bg-gray-700">
                            <td colSpan={products.length + 1} className="border border-gray-600 p-3 font-bold">
                                <div className="text-white font-bold">Thiết kế và vật liệu</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Kiểu thiết kế</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.designMaterial?.design || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Chất liệu</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.designMaterial?.material || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Kích thước và trọng lượng</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.designMaterial?.sizeWeight || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="border border-gray-600 p-3">
                                <div className="text-white">Ngày ra mắt</div>
                            </td>
                            {products.map(product => (
                                <td key={product._id} className="border border-gray-600 p-3">
                                    <div className="text-white">{product.details?.designMaterial?.releaseDate || 'N/A'}</div>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

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