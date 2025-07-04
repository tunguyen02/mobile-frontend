import { useState, useEffect } from 'react';
import 'antd/dist/reset.css';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import productDetailService from '../../services/productDetailService';
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaTruck, FaCheck, FaBox, FaInfoCircle, FaBolt, FaMicrochip, FaCamera, FaBatteryFull, FaMobileAlt, FaExchangeAlt } from 'react-icons/fa';
import { Tabs, Collapse, message, Spin, Badge, Divider, Breadcrumb, Card, Carousel, List, Button, Rate, Input, Modal, notification, Statistic } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { handleGetAccessToken } from '../../services/axiosJWT';
import cartService from '../../services/cartService';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../../redux/cartSlice';
import ProductReviews from "../../components/ProductReviews/ProductReviews";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import { isFlashSaleValid } from "../../utils/utils";

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Countdown } = Statistic;

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [product, setProduct] = useState(null);
    const [productDetail, setProductDetail] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [fade, setFade] = useState(false);
    const user = useSelector((state) => state.user.user);
    const [reviewModal, setReviewModal] = useState(false);
    const [userReviewData, setUserReviewData] = useState(null);
    const queryClient = useQueryClient();
    const [flashSaleInfo, setFlashSaleInfo] = useState(null);

    const mutationAddToCart = useMutation({
        mutationFn: () => {
            const accessToken = handleGetAccessToken();
            // Nếu đang trong Flash Sale và còn hiệu lực, gửi thông tin Flash Sale khi thêm vào giỏ hàng
            if (flashSaleInfo && isFlashSaleValid(flashSaleInfo)) {
                return cartService.addFlashSaleProductToCart(
                    accessToken,
                    productId,
                    flashSaleInfo.flashSaleId,
                    flashSaleInfo.discountPrice
                );
            }
            return cartService.addProductToCart(accessToken, productId);
        },
        onSuccess: (data) => {
            message.success(data?.message, 3);
            dispatch(setCart(data?.cart));
        },
        onError: (error) => {
            message.error("Thêm sản phẩm thất bại", 3);
            navigate('/sign-in');
        }
    });

    const { data, isPending } = mutationAddToCart;

    // Kiểm tra Flash Sale có đang active hay không
    const isFlashSaleActive = () => {
        return isFlashSaleValid(flashSaleInfo);
    };

    // Lấy thông tin Flash Sale từ localStorage khi component mount
    useEffect(() => {
        try {
            const storedFlashSaleInfo = localStorage.getItem(`flashSale_${productId}`);
            if (storedFlashSaleInfo) {
                const parsedInfo = JSON.parse(storedFlashSaleInfo);
                // Kiểm tra tính hợp lệ của Flash Sale
                if (isFlashSaleValid(parsedInfo)) {
                    setFlashSaleInfo(parsedInfo);
                } else {
                    // Xóa Flash Sale hết hạn hoặc hết số lượng
                    localStorage.removeItem(`flashSale_${productId}`);
                    setFlashSaleInfo(null);
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin Flash Sale:', error);
        }
    }, [productId]);

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

    // Kiểm tra người dùng đã đánh giá sản phẩm chưa
    useEffect(() => {
        if (user && product) {
            checkUserReviewStatus();
        }
    }, [user, product]);

    const checkUserReviewStatus = async () => {
        try {
            const accessToken = handleGetAccessToken();
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/review/user-can-review`,
                {
                    params: { productId: productId },
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            setUserReviewData(response.data);
        } catch (error) {
            console.error("Lỗi kiểm tra trạng thái đánh giá:", error);
        }
    };

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

    // Tính giá và % giảm giá dựa trên thông tin Flash Sale hoặc giá thường
    const getPrice = () => {
        if (flashSaleInfo && isFlashSaleActive()) {
            return flashSaleInfo.discountPrice;
        }
        return product?.price || 0;
    };

    const currentPrice = getPrice();
    const savingAmount = product?.originalPrice - currentPrice;
    const savingPercentage = Math.round((savingAmount / product?.originalPrice) * 100);

    const handleOpenReviewModal = () => {
        if (!user) {
            notification.warning({
                message: 'Cần đăng nhập',
                description: 'Vui lòng đăng nhập để đánh giá sản phẩm'
            });
            return;
        }
        setReviewModal(true);
    };

    const handleCloseReviewModal = () => {
        setReviewModal(false);
        // Refresh trạng thái đánh giá
        checkUserReviewStatus();
    };

    const handleAddToCompare = () => {
        // Lưu giá hiện tại của sản phẩm (giá sale nếu có)
        const productPrice = currentPrice;

        // Xây dựng URL cho trang so sánh với sản phẩm hiện tại là sản phẩm cố định
        let compareUrl = `/product/compare?fixedId=${productId}`;

        // Thêm thông tin giá
        if (productPrice) {
            compareUrl += `&price=${productPrice}`;
        }

        // Nếu sản phẩm đang giảm giá, thêm thông tin giảm giá
        if (savingPercentage > 0) {
            compareUrl += `&discount=${savingPercentage}`;

            // Nếu đang trong flash sale, thêm thông tin flash sale
            if (flashSaleInfo && isFlashSaleActive()) {
                compareUrl += '&isFlashSale=true';
                if (product?.originalPrice) {
                    compareUrl += `&originalPrice=${product.originalPrice}`;
                }
            }
        }

        // Chuyển hướng đến trang so sánh
        navigate(compareUrl);
    };

    if (isPending) {
        return <Spin size="large" className="flex justify-center items-center min-h-screen" />;
    }

    if (!product) {
        return <div className="text-center p-8">Không tìm thấy sản phẩm</div>;
    }

    // Chuẩn bị dữ liệu cho modal đánh giá
    let reviewModalProps = {};
    if (userReviewData) {
        if (userReviewData.hasReviewed) {
            // Người dùng đã đánh giá, lấy thông tin đánh giá để chỉnh sửa
            const fetchUserReview = async () => {
                try {
                    const accessToken = handleGetAccessToken();
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/review/user-product/${productId}`,
                        {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }
                    );
                    return response.data.data;
                } catch (error) {
                    console.error("Lỗi lấy thông tin đánh giá:", error);
                    return null;
                }
            };

            reviewModalProps = {
                product: product,
                orderId: userReviewData.orderId,
                reviewId: userReviewData.reviewId,
                isEdit: true,
                initialValues: null, // Sẽ được cập nhật khi lấy dữ liệu đánh giá
                onFetchReview: fetchUserReview
            };
        } else if (userReviewData.canReview) {
            // Người dùng có thể đánh giá mới
            reviewModalProps = {
                product: product,
                orderId: userReviewData.orderId,
                isEdit: false
            };
        }
    }

    // Đường dẫn ảnh chính
    const mainImageUrl = product.imageUrl[selectedImageIndex];

    return (
        <Spin spinning={isPending} tip="Đang xử lý..." className="text-gray-100">
            <div className='bg-gray-900 min-h-screen'>
                <div className='max-w-screen-xl mx-auto p-4 sm:p-6'>
                    <Breadcrumb
                        className="mb-4"
                        items={[
                            { title: <span className="text-white">Trang chủ /</span> },
                            { title: <span className="text-white">{product.name}</span> },
                        ]}
                    />

                    {/* Product Overview Section */}
                    <div className='bg-gray-800 rounded-xl shadow-xl overfflow-hidden border border-gray-700'>
                        <div className='flex flex-col md:flex-row'>
                            {/* Left side - Product Images */}
                            <div className="w-full md:w-3/5 lg:w-2/3">
                                {product && product?.imageUrl && (
                                    <div className="relative h-full flex flex-col justify-between">
                                        <div className={`flex-grow transition-all duration-500 ${fade ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                            <div className="relative group flex items-center justify-center py-4 px-8 mt-4">
                                                <img
                                                    src={mainImageUrl}
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
                                                    {flashSaleInfo && isFlashSaleActive() ? (
                                                        <h2 className="text-base font-bold flex items-center text-yellow-400">
                                                            <FaBolt className="mr-2" size={16} /> FLASH SALE
                                                        </h2>
                                                    ) : (
                                                        <h2 className="text-base font-bold flex items-center text-orange-400">
                                                            <FaBolt className="mr-2" size={16} /> Giá Ưu Đãi
                                                        </h2>
                                                    )}
                                                    {savingPercentage > 0 && (
                                                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                            -{savingPercentage}%
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Hiển thị đếm ngược nếu đang là flash sale */}
                                                {flashSaleInfo && isFlashSaleActive() && (
                                                    <div className="mt-2 bg-gray-700 p-2 rounded-lg">
                                                        <div className="text-xs text-gray-300 mb-1">Kết thúc sau:</div>
                                                        <Countdown
                                                            value={new Date(flashSaleInfo.endTime).getTime()}
                                                            format="HH:mm:ss"
                                                            className="text-white font-bold text-lg"
                                                            style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.5rem' }}
                                                        />
                                                        <div className="text-xs text-gray-300 mt-1">
                                                            Còn lại: {flashSaleInfo.quantity - flashSaleInfo.soldCount}/{flashSaleInfo.quantity}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex items-end">
                                                    <div className="text-3xl font-bold text-orange-500">
                                                        {formatCurrency(currentPrice)}<sup>₫</sup>
                                                    </div>
                                                    {product?.originalPrice > currentPrice && (
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

                                                <button
                                                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all flex items-center justify-center"
                                                    onClick={handleAddToCompare}
                                                >
                                                    <FaExchangeAlt className="mr-2" size={16} />
                                                    <span className="text-base">So sánh sản phẩm</span>
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

                    {/* Phần đánh giá sản phẩm */}
                    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 my-8">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">
                                    Đánh giá sản phẩm
                                </h2>
                                {user && (
                                    <button
                                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition"
                                        onClick={handleOpenReviewModal}
                                        disabled={userReviewData && !userReviewData.canReview && !userReviewData.hasReviewed}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span>{userReviewData?.hasReviewed ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}</span>
                                    </button>
                                )}
                            </div>
                            <ProductReviews productId={productId} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal đánh giá sản phẩm */}
            {reviewModalProps.product && (
                <Modal
                    title={reviewModalProps.isEdit ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}
                    open={reviewModal}
                    onCancel={handleCloseReviewModal}
                    footer={null}
                    width={600}
                >
                    <ReviewForm
                        product={reviewModalProps.product}
                        orderId={reviewModalProps.orderId}
                        reviewId={reviewModalProps.reviewId}
                        isEdit={reviewModalProps.isEdit}
                        initialValues={reviewModalProps.initialValues}
                        onClose={handleCloseReviewModal}
                        onSuccess={() => {
                            queryClient.invalidateQueries(['product-reviews', productId]);
                            queryClient.invalidateQueries(['user-can-review', productId]);
                        }}
                    />
                </Modal>
            )}
        </Spin>
    );
};

export default ProductDetail;
