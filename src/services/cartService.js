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
    }
}

export default cartService;