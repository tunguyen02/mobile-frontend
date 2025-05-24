import axiosJWT from "./axiosJWT";

const apiUrl = import.meta.env.VITE_API_URL;

const orderService = {
    createOrder: async (accessToken, shippingInfo, paymentMethod, cartWithFlashSale) => {
        try {
            const response = await axiosJWT.post(
                `${apiUrl}/order/create`,
                {
                    shippingInfo,
                    paymentMethod,
                    cartWithFlashSale
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.log("Tạo đơn hàng thất bại:", error);
            throw error;
        }
    },
    getAllOrders: async (accessToken) => {
        const response = await axiosJWT.get(`${apiUrl}/order/get-all`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    },
    changeOrderStatus: async (accessToken, orderId, data) => {
        const response = await axiosJWT.patch(
            `${apiUrl}/order/change-status/${orderId}`,
            { ...data },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data;
    },
    deleteOrder: async (accessToken, orderId) => {
        const response = await axiosJWT.delete(
            `${apiUrl}/order/delete/${orderId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data;
    },
    getMyOrders: async (accessToken) => {
        const response = await axiosJWT.get(`${apiUrl}/order/my-orders`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data;
    },
    // Thêm phương thức để lấy đơn hàng của người dùng cho phần đánh giá
    getUserOrders: async (accessToken) => {
        try {
            const response = await axiosJWT.get(`${apiUrl}/order/my-orders`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lấy danh sách đơn hàng thất bại:", error);
            throw error;
        }
    },
    getOrderDetails: async (accessToken, orderId) => {
        const response = await axiosJWT.get(`${apiUrl}/order/details/${orderId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data;
    },
    // Phương thức để lấy thông tin đơn hàng từ trang success không yêu cầu token
    getOrderById: async (orderId) => {
        try {
            const accessToken = localStorage.getItem("access_token")
                ? JSON.parse(localStorage.getItem("access_token"))
                : null;

            if (!accessToken) {
                console.warn("No access token found, using public endpoint");
                // Dùng axios thông thường nếu không có token
                const axios = (await import('axios')).default;
                const response = await axios.get(`${apiUrl}/order/public/${orderId}`);
                return response.data;
            }

            // Nếu có token, sử dụng endpoint có xác thực
            const response = await axiosJWT.get(`${apiUrl}/order/details/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lấy thông tin đơn hàng thất bại:", error);
            return {
                status: 'ERR',
                message: error.message
            };
        }
    },
    countOrders: async () => {
        try {
            const response = await axiosJWT.get(`${apiUrl}/order/count`, {
                headers: {
                    Authorization: `Bearer ${JSON.parse(
                        localStorage.getItem("access_token")
                    )}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lấy số lượng đơn hàng thất bại:", error);
            throw error;
        }
    },
};

export default orderService;