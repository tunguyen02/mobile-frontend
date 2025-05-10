import axiosJWT from "./axiosJWT";
import { isFlashSaleValid, updateFlashSaleSoldCount } from "../utils/utils";

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
        // Kiểm tra trước nếu Flash Sale còn hiệu lực
        const flashSaleData = localStorage.getItem(`flashSale_${productId}`);
        let isValidFlashSale = false;

        if (flashSaleData) {
            const parsedData = JSON.parse(flashSaleData);
            isValidFlashSale = isFlashSaleValid(parsedData);

            // Nếu Flash Sale không còn hiệu lực, xóa khỏi localStorage và thêm sản phẩm với giá thường
            if (!isValidFlashSale) {
                localStorage.removeItem(`flashSale_${productId}`);
                return cartService.addProductToCart(accessToken, productId);
            }
        } else {
            // Không có thông tin Flash Sale, thêm với giá thường
            return cartService.addProductToCart(accessToken, productId);
        }

        // Đầu tiên, thêm sản phẩm vào giỏ hàng với thông tin Flash Sale
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

        // Cập nhật số lượng đã bán trong Flash Sale
        updateFlashSaleSoldCount(productId, 1);

        return response.data;
    }
}

export default cartService;