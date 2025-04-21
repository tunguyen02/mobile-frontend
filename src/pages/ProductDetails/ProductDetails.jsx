import { useState, useEffect } from 'react';
import 'antd/dist/reset.css';
import { useParams } from 'react-router-dom';
import productService from '../../services/productService';
import productDetailService from '../../services/productDetailService';
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaTruck, FaCheck, FaBox, FaInfoCircle, FaBolt, FaMicrochip, FaCamera, FaBatteryFull, FaMobileAlt } from 'react-icons/fa';
import { Tabs, Collapse, message, Spin, Badge, Divider } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { handleGetAccessToken } from '../../services/axiosJWT';
import cartService from '../../services/cartService';
import { useDispatch } from 'react-redux';
import { setCart } from '../../redux/cartSlice';

const { TabPane } = Tabs;
const { Panel } = Collapse;

const ProductDetail = () => {
    const { productId } = useParams();
    const dispatch = useDispatch();
    const [product, setProduct] = useState(null);
    const [productDetail, setProductDetail] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [fade, setFade] = useState(false);

    const mutationAddToCart = useMutation({
        mutationFn: () => {
            const accessToken = handleGetAccessToken();
            return cartService.addProductToCart(accessToken, productId);
        },
        onSuccess: (data) => {
            message.success(data?.message, 3);
            dispatch(setCart(data?.cart));
        },
        onError: (error) => {
            message.error("Thêm sản phẩm thất bại", 3);
        }
    });

    const { data, isPending } = mutationAddToCart;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productResponse = await productService.getProductById(productId);
                const productDetailResponse = await productDetailService.getProductDetail(productId);
                setProduct(productResponse.product);
                setProductDetail(productDetailResponse.data);
            } catch (error) {
                console.error('Error fetching product or product details', error);
            }
        };

        fetchData();
    }, [productId]);

    const handleNextImage = () => {
        if (product && product?.imageUrl) {
            setFade(true);
            setTimeout(() => {
                setSelectedImageIndex((prevIndex) =>
                    prevIndex === product?.imageUrl?.length - 1 ? 0 : prevIndex + 1
                );
                setFade(false);
            }, 300);
        }
    };

    const handlePreviousImage = () => {
        if (product && product?.imageUrl) {
            setFade(true);
            setTimeout(() => {
                setSelectedImageIndex((prevIndex) =>
                    prevIndex === 0 ? product?.imageUrl?.length - 1 : prevIndex - 1
                );
                setFade(false);
            }, 300);
        }
    };

    const handleThumbnailClick = (index) => {
        setFade(true);
        setTimeout(() => {
            setSelectedImageIndex(index);
            setFade(false);
        }, 300);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN").format(amount);
    };

    const addToCart = () => {
        mutationAddToCart.mutate();
    }

    const savingAmount = product?.originalPrice - product?.price;
    const savingPercentage = Math.round((savingAmount / product?.originalPrice) * 100);

    return (
        <Spin spinning={isPending} tip="Đang xử lý..." className="text-gray-100">
            <div className='bg-gray-900 min-h-screen'>
                <div className='max-w-screen-xl mx-auto p-4 sm:p-6'>
                    {/* Product Overview Section */}
                    <div className='bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700'>
                        <div className='flex flex-col md:flex-row'>
                            {/* Left side - Product Images */}
                            <div className="w-full md:w-3/5 lg:w-2/3">
                                {product && product?.imageUrl && (
                                    <div className="relative h-full flex flex-col justify-between">
                                        <div className={`flex-grow transition-all duration-500 ${fade ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                            <div className="relative group flex items-center justify-center py-4 px-8 mt-4">
                                                <img
                                                    src={product?.imageUrl[selectedImageIndex]}
                                                    alt={product?.name}
                                                    className="rounded-xl shadow-xl object-contain h-[500px] max-h-full"
                                                />

                                                {/* Sale badge */}
                                                {savingPercentage > 0 && (
                                                    <div className="absolute top-4 left-4 bg-red-600 text-white rounded-full px-3 py-1 text-sm font-bold shadow-lg transform rotate-[-5deg] animate-pulse">
                                                        -{savingPercentage}%
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={handlePreviousImage}
                                                className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-4 shadow-xl opacity-70 hover:opacity-100 hover:bg-black/70 transition-all"
                                            >
                                                <FaChevronLeft size={20} />
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-4 shadow-xl opacity-70 hover:opacity-100 hover:bg-black/70 transition-all"
                                            >
                                                <FaChevronRight size={20} />
                                            </button>
                                        </div>

                                        {/* Fixed thumbnail row */}
                                        <div className="flex justify-center gap-3 p-4 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 mb-4">
                                            {product?.imageUrl?.slice(0, 6).map((img, index) => (
                                                <div
                                                    key={index}
                                                    className={`cursor-pointer transition-all duration-300 ${selectedImageIndex === index
                                                        ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/40 scale-110'
                                                        : 'border border-gray-600 hover:border-gray-400'
                                                        } rounded-lg overflow-hidden`}
                                                    onClick={() => handleThumbnailClick(index)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        className="w-16 h-16 object-contain bg-gray-900 p-1"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right side - Product Info */}
                            <div className="w-full md:w-2/5 lg:w-1/3 p-6 border-l border-gray-700">
                                {product && (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center">
                                                <Badge color="green" />
                                                <span className="ml-2 text-green-400 font-medium">Còn hàng</span>
                                            </div>
                                            <h1 className="text-2xl font-bold mt-2 text-white">{product?.name}</h1>
                                        </div>

                                        {productDetail && (
                                            <div className="flex flex-wrap gap-2">
                                                <div className="px-3 py-1.5 bg-gray-700 rounded-full flex items-center">
                                                    <FaInfoCircle className="text-orange-400 mr-2" size={14} />
                                                    <span className="text-gray-200 text-sm">{productDetail.specifications.storage}</span>
                                                </div>
                                                <div className="px-3 py-1.5 bg-gray-700 rounded-full flex items-center">
                                                    <FaMobileAlt className="text-orange-400 mr-2" size={14} />
                                                    <span className="text-gray-200 text-sm">Màu: {product?.color || "Không có thông tin"}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="rounded-xl shadow-lg overflow-hidden border border-gray-700">
                                            <div className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-base font-bold flex items-center text-orange-400">
                                                        <FaBolt className="mr-2" size={16} /> Giá Ưu Đãi
                                                    </h2>
                                                    {savingPercentage > 0 && (
                                                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                            -{savingPercentage}%
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex items-end">
                                                    <div className="text-3xl font-bold text-orange-500">
                                                        {formatCurrency(product?.price)}<sup>₫</sup>
                                                    </div>
                                                    {product?.originalPrice > product?.price && (
                                                        <div className="ml-2 text-sm text-gray-400 line-through self-end">{formatCurrency(product?.originalPrice)}<sup>₫</sup></div>
                                                    )}
                                                </div>

                                                <div className="mt-4 space-y-2 text-gray-200 text-sm">
                                                    <div className="flex items-center">
                                                        <FaCheck className="mr-2 text-green-400" size={12} /> Giao hàng miễn phí
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaCheck className="mr-2 text-green-400" size={12} /> Bảo hành 12 tháng
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaCheck className="mr-2 text-green-400" size={12} /> Đổi trả trong 30 ngày
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-gray-900 border-t border-gray-700">
                                                <button
                                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all flex items-center justify-center"
                                                    onClick={addToCart}
                                                >
                                                    <FaShoppingCart className="mr-2" size={16} />
                                                    <span className="text-base">Thêm vào giỏ hàng</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex bg-gray-700 p-3 rounded-lg">
                                                <div className="bg-gray-800 text-orange-400 p-2 rounded-lg mr-3 flex items-center justify-center">
                                                    <FaBox size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white text-sm">Bộ sản phẩm gồm</h3>
                                                    <p className="text-gray-300 text-xs">Cáp, Cây lấy sim, Hộp, Sách hướng dẫn</p>
                                                </div>
                                            </div>

                                            <div className="flex bg-gray-700 p-3 rounded-lg">
                                                <div className="bg-gray-800 text-orange-400 p-2 rounded-lg mr-3 flex items-center justify-center">
                                                    <FaTruck size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white text-sm">Vận chuyển</h3>
                                                    <p className="text-gray-300 text-xs">Giao hàng nhanh toàn quốc</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="mt-8 bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6 text-center text-orange-400">
                                Thông số kỹ thuật
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 border border-gray-700 rounded-xl bg-gray-750 shadow-lg">
                                    <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
                                        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                            <FaMicrochip className="text-orange-400" size={18} />
                                        </div>
                                        Cấu hình & Bộ nhớ
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Hệ điều hành</span>
                                            <span className="font-medium text-gray-200">{productDetail?.specifications.os}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">CPU</span>
                                            <span className="font-medium text-gray-200">{productDetail?.specifications.cpu}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">GPU</span>
                                            <span className="font-medium text-gray-200">{productDetail?.specifications.gpu}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">RAM</span>
                                            <span className="font-medium text-gray-200">{productDetail?.specifications.ram}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Bộ nhớ</span>
                                            <span className="font-medium text-gray-200">{productDetail?.specifications.storage}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border border-gray-700 rounded-xl bg-gray-750 shadow-lg">
                                    <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
                                        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                            <FaCamera className="text-orange-400" size={18} />
                                        </div>
                                        Camera & Màn hình
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Camera sau</span>
                                            <span className="font-medium text-gray-200">{productDetail?.cameraDisplay.backCamera}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Camera trước</span>
                                            <span className="font-medium text-gray-200">{productDetail?.cameraDisplay.frontCamera}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Công nghệ Màn hình</span>
                                            <span className="font-medium text-gray-200">{productDetail?.cameraDisplay?.displayTech}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Độ phân giải màn hình</span>
                                            <span className="font-medium text-gray-200">{productDetail?.cameraDisplay?.displayResolution}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border border-gray-700 rounded-xl bg-gray-750 shadow-lg">
                                    <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
                                        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                            <FaBatteryFull className="text-orange-400" size={18} />
                                        </div>
                                        Pin & Sạc
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Dung lượng</span>
                                            <span className="font-medium text-gray-200">{productDetail?.pinAdapter?.pinCapacity}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Loại pin</span>
                                            <span className="font-medium text-gray-200">{productDetail?.pinAdapter?.pinType}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Công suất tối đa</span>
                                            <span className="font-medium text-gray-200">{productDetail?.pinAdapter?.maxAdapterPower}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border border-gray-700 rounded-xl bg-gray-750 shadow-lg">
                                    <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
                                        <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center mr-2">
                                            <FaMobileAlt className="text-orange-400" size={18} />
                                        </div>
                                        Thiết kế & Chất liệu
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Thiết kế</span>
                                            <span className="font-medium text-gray-200">{productDetail?.designMaterial?.design}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Chất liệu</span>
                                            <span className="font-medium text-gray-200">{productDetail?.designMaterial?.material}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 text-sm">Kích thước và trọng lượng</span>
                                            <span className="font-medium text-gray-200">{productDetail?.designMaterial?.sizeWeight}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews section - simplified */}
                    <div className="mt-8 bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-6 text-center text-orange-400">
                                Đánh giá sản phẩm
                            </h2>
                            <div className="text-center p-8">
                                <p className="text-gray-300">Sản phẩm chưa có đánh giá.</p>
                                <button className="mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg border border-gray-600 transition-all">
                                    Viết đánh giá
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Spin>
    );
};

export default ProductDetail;
