import axiosJWT from "./axiosJWT";

const apiUrl = import.meta.env.VITE_API_URL;
const cartApiUrl = `${apiUrl}/cart`;

const cartService = {
    getMyCart: async (accessToken) => {
        const response = await axiosJWT.get(`${cartApiUrl}/my-cart`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data;
    },
    updateProduct: async (accessToken, productId, quantity) => {
        const response = await axiosJWT.patch(`${cartApiUrl}/update-product`, {
            productId,
            quantity
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data;
    },
    addProductToCart: async (accessToken, productId) => {
        const response = await axiosJWT.patch(`${cartApiUrl}/add-product`, {
            productId
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data;
    },
    addFlashSaleProductToCart: async (accessToken, productId, flashSaleId, discountPrice) => {
        // Đầu tiên, thêm sản phẩm vào giỏ hàng
        const response = await axiosJWT.patch(`${cartApiUrl}/add-product`, {
            productId,
            isFlashSale: true,
            flashSaleId: flashSaleId,
            discountPrice: discountPrice
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // Lưu thông tin Flash Sale vào localStorage (sử dụng cùng key với FlashSaleSection)
        const flashSaleData = localStorage.getItem(`flashSale_${productId}`);
        if (!flashSaleData) {
            // Chỉ lưu nếu chưa có (để không ghi đè thông tin đầy đủ hơn từ FlashSaleSection)
            const flashSaleCartItem = {
                flashSaleId,
                discountPrice,
                endTime: new Date().getTime() + (24 * 60 * 60 * 1000) // Mặc định 24h nếu không có thông tin
            };
            localStorage.setItem(`flashSale_${productId}`, JSON.stringify(flashSaleCartItem));
        }

        return response.data;
    }
}

export default cartService;