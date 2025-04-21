import axiosJWT from "./axiosJWT";

const apiUrl = import.meta.env.VITE_API_URL;

const orderService = {
    createOrder: async (accessToken, shippingInfo, paymentMethod) => {
        try {
            const response = await axiosJWT.post(
                `${apiUrl}/order/create`,
                { shippingInfo, paymentMethod },
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