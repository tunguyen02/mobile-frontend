import { useEffect, useState } from 'react';
import { Typography, Card, Button, Carousel, Tag, Statistic, message, Empty } from 'antd';
import { ThunderboltOutlined, ShoppingCartOutlined, RightOutlined } from '@ant-design/icons';
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

    const handleViewProduct = (productId) => {
        try {
            navigate(`/product/product-details/${productId}`);
        } catch (error) {
            console.error('Error navigating to product details:', error);
            message.error('Có lỗi xảy ra khi xem chi tiết sản phẩm');
        }
    };

    if (loading) {
        return (
            <div className="flash-sale-section bg-gradient-to-r from-blue-800 to-purple-800 py-8 px-4 md:px-20 my-8 rounded-lg shadow-xl">
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flash-sale-section bg-gradient-to-r from-blue-800 to-purple-800 py-8 px-4 md:px-20 my-8 rounded-lg shadow-xl">
                <div className="flex items-center mb-6">
                    <ThunderboltOutlined className="text-3xl text-indigo-300 mr-2" />
                    <Title level={2} className="!text-white !m-0">FLASH SALE</Title>
                </div>
                <div className="bg-black bg-opacity-50 rounded-lg p-4 text-center text-white">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (activeFlashSales.length === 0) {
        return (
            <div className="flash-sale-section bg-gradient-to-r from-blue-800 to-purple-800 py-8 px-4 md:px-20 my-8 rounded-lg shadow-xl">
                <div className="flex items-center mb-6">
                    <ThunderboltOutlined className="text-3xl text-indigo-300 mr-2" />
                    <Title level={2} className="!text-white !m-0">FLASH SALE</Title>
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
        <div className="flash-sale-section bg-gradient-to-r from-blue-800 to-purple-800 py-8 px-4 md:px-20 my-8 rounded-lg shadow-xl">
            <div className="flash-sale-header flex items-center justify-between mb-6 border-b border-purple-700 pb-4">
                <div className="flex items-center">
                    <ThunderboltOutlined className="text-3xl text-indigo-300 mr-2 animate-pulse" />
                    <Title level={2} className="!text-white !m-0 font-bold">FLASH SALE</Title>
                </div>
                <div className="bg-indigo-900 bg-opacity-60 py-2 px-4 rounded-full flex items-center space-x-2">
                    <Text className="text-white mr-2">Kết thúc sau:</Text>
                    <Countdown 
                        value={new Date(currentFlashSale.endTime).getTime()} 
                        format="HH:mm:ss"
                        className="text-indigo-200 font-bold"
                    />
                </div>
            </div>

            <Carousel
                autoplay={false}
                dots={false}
                arrows={true}
                slidesToShow={4}
                slidesToScroll={1}
                className="custom-carousel"
                responsive={[
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 1
                        }
                    },
                    {
                        breakpoint: 768,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 1
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
                nextArrow={<div className="custom-arrow next"><RightOutlined /></div>}
                prevArrow={<div className="custom-arrow prev"><RightOutlined /></div>}
            >
                {currentFlashSale.products.map((item) => {
                    const product = item.product;
                    const discountPercent = calculateDiscount(product.price, item.discountPrice);
                    
                    return (
                        <div key={product._id} className="px-3">
                            <Card 
                                hoverable
                                className="overflow-hidden border-0 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                cover={
                                    <div className="relative h-48 overflow-hidden bg-white">
                                        <img 
                                            alt={product.name}
                                            src={Array.isArray(product.imageUrl) && product.imageUrl.length > 0 
                                                ? product.imageUrl[0] 
                                                : (product.imageUrl || 'https://placehold.co/600x400?text=No+Image')}
                                            className="w-full h-full object-contain p-2"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                                            }}
                                        />
                                        <Tag color="purple" className="absolute top-2 right-2 font-bold px-2 py-1 text-sm rounded">
                                            -{discountPercent}%
                                        </Tag>
                                    </div>
                                }
                                bodyStyle={{ padding: '12px', backgroundColor: '#1e1b4b' }}
                            >
                                <div className="h-28 overflow-hidden">
                                    <Title level={5} className="!text-white !mb-1 truncate">{product.name}</Title>
                                    <div className="flex items-center mb-2">
                                        <Text className="text-purple-300 font-bold mr-2 text-lg">{item.discountPrice.toLocaleString('vi-VN')}đ</Text>
                                        <Text delete className="text-gray-400 text-sm">{product.price.toLocaleString('vi-VN')}đ</Text>
                                    </div>
                                    <div className="bg-indigo-900 rounded-full py-1 px-3 inline-block mb-2">
                                        <Text className="text-xs text-indigo-200">
                                            Còn lại: {item.quantity - item.soldCount}/{item.quantity}
                                        </Text>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mt-3">
                                    <Button 
                                        type="primary" 
                                        className="flex-1 rounded-full"
                                        onClick={() => handleViewProduct(product._id)}
                                    >
                                        Xem
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        danger
                                        icon={<ShoppingCartOutlined />}
                                        style={{ background: '#7e22ce', borderColor: '#7e22ce' }}
                                        className="flex-1 rounded-full"
                                        onClick={() => handleAddToCart(product, currentFlashSale)}
                                    >
                                        Mua ngay
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </Carousel>

            <style jsx global>{`
                .custom-carousel .slick-arrow {
                    color: white;
                    font-size: 24px;
                    z-index: 10;
                    background-color: rgba(79, 70, 229, 0.3);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .custom-carousel .slick-arrow:hover {
                    background-color: rgba(79, 70, 229, 0.6);
                }
                .custom-carousel .slick-arrow.slick-prev {
                    left: -30px;
                }
                .custom-carousel .slick-arrow.slick-next {
                    right: -25px;
                }
                .custom-carousel .slick-arrow.slick-prev:before,
                .custom-carousel .slick-arrow.slick-next:before {
                    color: white;
                    font-size: 24px;
                }
                .custom-carousel .slick-track {
                    margin-left: 0;
                }
            `}</style>
        </div>
    );
};

export default FlashSaleSection; 