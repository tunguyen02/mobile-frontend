import { useEffect, useState } from 'react';
import { Typography, Card, Carousel, Tag, Statistic, message, Empty, Row, Col } from 'antd';
import { ThunderboltOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import flashSaleService from '../../services/flashSaleService';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../../redux/cartSlice';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

const FlashSaleSection = () => {
    const [activeFlashSales, setActiveFlashSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);

    useEffect(() => {
        const fetchActiveFlashSales = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Fetching active flash sales...');
                const response = await flashSaleService.getActiveFlashSales();
                console.log('Active flash sales response:', response);
                setActiveFlashSales(response.data || []);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu Flash Sale:', error);
                setError('Không thể tải dữ liệu Flash Sale');
            } finally {
                setLoading(false);
            }
        };

        fetchActiveFlashSales();
    }, []);

    const calculateDiscount = (originalPrice, discountPrice) => {
        try {
            const discount = ((originalPrice - discountPrice) / originalPrice) * 100;
            return Math.round(discount);
        } catch (error) {
            console.error('Error calculating discount:', error);
            return 0;
        }
    };

    const handleAddToCart = (product, flashSale) => {
        try {
            // Tìm thông tin sản phẩm flash sale
            const flashSaleProduct = flashSale.products.find(p => p.product._id === product._id);

            if (flashSaleProduct) {
                const newProduct = {
                    ...product,
                    price: flashSaleProduct.discountPrice,
                    quantity: 1,
                    isFlashSale: true,
                    flashSaleId: flashSale._id
                };

                // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
                const existingProductIndex = cart.products?.findIndex(item =>
                    item._id === product._id && item.isFlashSale && item.flashSaleId === flashSale._id
                );

                let newCart = { ...cart };
                if (!newCart.products) newCart.products = [];

                if (existingProductIndex !== -1 && existingProductIndex !== undefined) {
                    // Nếu đã có, tăng số lượng
                    const updatedProducts = [...newCart.products];
                    updatedProducts[existingProductIndex].quantity += 1;
                    newCart.products = updatedProducts;
                } else {
                    // Nếu chưa có, thêm mới
                    newCart.products = [...newCart.products, newProduct];
                }

                // Cập nhật tổng giá
                newCart.totalPrice = newCart.products.reduce((total, item) => {
                    return total + (item.price * item.quantity);
                }, 0);

                // Dispatch action để cập nhật giỏ hàng
                dispatch(setCart(newCart));
                message.success('Đã thêm sản phẩm vào giỏ hàng!');
            } else {
                message.error('Không tìm thấy thông tin sản phẩm Flash Sale');
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
            message.error('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
        }
    };

    const handleViewProduct = (productId, flashSaleInfo) => {
        try {
            // Lưu thông tin flash sale vào localStorage để sử dụng ở trang chi tiết
            if (flashSaleInfo) {
                const flashSaleData = {
                    flashSaleId: flashSaleInfo.flashSaleId,
                    discountPrice: flashSaleInfo.discountPrice,
                    quantity: flashSaleInfo.quantity,
                    soldCount: flashSaleInfo.soldCount,
                    endTime: flashSaleInfo.endTime
                };
                localStorage.setItem(`flashSale_${productId}`, JSON.stringify(flashSaleData));
            }

            navigate(`/product/product-details/${productId}`);
        } catch (error) {
            console.error('Error navigating to product details:', error);
            message.error('Có lỗi xảy ra khi xem chi tiết sản phẩm');
        }
    };

    // Tính phần trăm đã bán
    const calculateSoldPercentage = (soldCount, totalQuantity) => {
        return (soldCount / totalQuantity) * 100;
    };

    // Kiểm tra sản phẩm bán chạy (đã bán > 50%)
    const isHotSelling = (soldCount, totalQuantity) => {
        return (soldCount / totalQuantity) > 0.5;
    };

    if (loading) {
        return (
            <div className="flash-sale-section bg-black py-8 px-4 md:px-6 my-8 rounded-lg shadow-xl">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flash-sale-section bg-black py-8 px-4 md:px-6 my-8 rounded-lg shadow-xl">
                <div className="flex items-center mb-6 justify-center">
                    <ThunderboltOutlined className="text-3xl text-yellow-400 mr-2" />
                    <Title level={2} className="!text-yellow-400 !m-0">FLASH SALE</Title>
                </div>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 text-center text-white">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (activeFlashSales.length === 0) {
        return (
            <div className="flash-sale-section bg-black py-8 px-4 md:px-6 my-8 rounded-lg shadow-xl">
                <div className="flex items-center mb-6 justify-center">
                    <ThunderboltOutlined className="text-3xl text-yellow-400 mr-2" />
                    <Title level={2} className="!text-yellow-400 !m-0">FLASH SALE</Title>
                </div>
                <Empty
                    description={<Text className="text-white">Hiện không có chương trình Flash Sale nào đang diễn ra</Text>}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="!text-white my-8"
                />
            </div>
        );
    }

    // Lấy flash sale đầu tiên để hiển thị
    const currentFlashSale = activeFlashSales[0];

    return (
        <div className="flash-sale-section bg-black py-4 pb-8 my-8 rounded-lg shadow-xl relative">
            <div className="absolute left-5 top-14 lg:left-8 lg:top-14 text-white z-10">
                <div className="text-sm text-yellow-500 font-semibold">KẾT THÚC TRONG</div>
            </div>

            {/* Logo FLASHSALE phong cách như hình */}
            <div className="relative w-full flex justify-center mb-12 pt-6">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-0.5 w-16 bg-yellow-400 transform -rotate-45"></div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-0.5 w-16 bg-yellow-400 transform rotate-45"></div>

                <div className="text-center">
                    <h1 className="text-yellow-400 text-5xl font-bold m-0 tracking-wider flex items-center justify-center">
                        <ThunderboltOutlined className="mr-2 text-4xl" />
                        FLASHSALE
                    </h1>
                </div>
            </div>

            <div className="px-6 md:px-12">
                <Carousel
                    arrows={true}
                    nextArrow={<div className="custom-arrow next-arrow"><RightOutlined /></div>}
                    prevArrow={<div className="custom-arrow prev-arrow"><LeftOutlined /></div>}
                    dots={false}
                    slidesToShow={5}
                    slidesToScroll={5}
                    responsive={[
                        {
                            breakpoint: 1280,
                            settings: {
                                slidesToShow: 4,
                                slidesToScroll: 4
                            }
                        },
                        {
                            breakpoint: 1024,
                            settings: {
                                slidesToShow: 3,
                                slidesToScroll: 3
                            }
                        },
                        {
                            breakpoint: 768,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 2
                            }
                        },
                        {
                            breakpoint: 480,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1
                            }
                        }
                    ]}
                    className="flash-sale-carousel"
                >
                    {currentFlashSale.products.map((item) => {
                        const product = item.product;
                        const discountPercent = calculateDiscount(product.price, item.discountPrice);

                        // Tạo đối tượng thông tin flash sale để truyền cho trang chi tiết
                        const flashSaleInfo = {
                            flashSaleId: currentFlashSale._id,
                            discountPrice: item.discountPrice,
                            quantity: item.quantity,
                            soldCount: item.soldCount,
                            endTime: currentFlashSale.endTime
                        };

                        return (
                            <div key={product._id} className="px-2 pb-3">
                                <div
                                    className="flash-sale-product bg-zinc-900 rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => handleViewProduct(product._id, flashSaleInfo)}
                                >
                                    <div className="relative bg-white p-4 flex justify-center items-center h-44">
                                        <img
                                            alt={product.name}
                                            src={Array.isArray(product.imageUrl) && product.imageUrl.length > 0
                                                ? product.imageUrl[0]
                                                : (product.imageUrl || 'https://placehold.co/600x400?text=No+Image')}
                                            className="h-full object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                                            -{discountPercent}%
                                        </div>
                                    </div>

                                    <div className="p-3 text-center">
                                        <h3 className="text-white text-sm h-10 line-clamp-2 leading-tight mb-2">{product.name}</h3>

                                        <div className="flex flex-col items-center">
                                            <div className="text-yellow-400 font-bold text-lg">
                                                {item.discountPrice.toLocaleString('vi-VN')}₫
                                            </div>
                                            <div className="text-gray-400 text-xs line-through">
                                                {product.price.toLocaleString('vi-VN')}₫
                                            </div>
                                        </div>

                                        <div className="mt-2 bg-yellow-500 bg-opacity-20 rounded-full h-5 relative overflow-hidden">
                                            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                                                style={{ width: `${Math.min(100, (item.soldCount / item.quantity) * 100)}%` }}>
                                            </div>
                                            <div className="relative z-10 text-center text-white text-xs leading-5">
                                                Còn {item.quantity - item.soldCount}/{item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </Carousel>
            </div>

            {/* Hiển thị đếm ngược ở góc phải trên */}
            <div className="absolute right-5 top-14 lg:right-8 lg:top-14 z-10">
                <div className="countdown-display bg-white px-3 py-1.5 border border-yellow-500 rounded">
                    <Countdown
                        value={new Date(currentFlashSale.endTime).getTime()}
                        format="HH : mm : ss"
                        className="text-black text-xl font-bold"
                    />
                </div>
            </div>

            <style jsx global>{`
                .flash-sale-carousel .slick-slide {
                    padding: 0 4px;
                }
                
                .flash-sale-carousel .slick-track {
                    margin-left: 0;
                }
                
                .custom-arrow {
                    position: absolute;
                    top: 40%;
                    transform: translateY(-50%);
                    z-index: 10;
                    width: 32px;
                    height: 32px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 50%;
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: all 0.3s;
                }
                
                .custom-arrow:hover {
                    opacity: 1;
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .prev-arrow {
                    left: 10px;
                }
                
                .next-arrow {
                    right: 10px;
                }
                
                /* Countdown styling */
                .ant-statistic-content {
                    font-size: inherit !important;
                }
                
                .ant-statistic-content-value {
                    display: flex !important;
                    font-size: inherit !important;
                }
                
                .ant-statistic-content-value-int,
                .ant-statistic-content-value-decimal {
                    font-size: inherit !important;
                }
                
                /* Line clamp for product names */
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default FlashSaleSection; 