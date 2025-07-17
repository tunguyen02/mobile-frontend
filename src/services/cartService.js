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
        const flashSaleData = localStorage.getItem(`flashSale_${productId}`);
        let isValidFlashSale = false;

        if (flashSaleData) {
            const parsedData = JSON.parse(flashSaleData);
            isValidFlashSale = isFlashSaleValid(parsedData);

            if (!isValidFlashSale) {
                localStorage.removeItem(`flashSale_${productId}`);
                return cartService.addProductToCart(accessToken, productId);
            }
        } else {
            return cartService.addProductToCart(accessToken, productId);
        }

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

        updateFlashSaleSoldCount(productId, 1);

        return response.data;
    }
}

export default cartService;