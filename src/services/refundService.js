import axiosJWT from "./axiosJWT";

const apiUrl = import.meta.env.VITE_API_URL;

const refundService = {
    // Yêu cầu hoàn tiền
    createRefundRequest: async (accessToken, orderId, reason) => {
        try {
            const response = await axiosJWT.post(
                `${apiUrl}/refund/request`,
                { orderId, reason },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Yêu cầu hoàn tiền thất bại:", error);
            throw error;
        }
    },

    // Lấy danh sách yêu cầu hoàn tiền của người dùng
    getUserRefunds: async (accessToken) => {
        try {
            const response = await axiosJWT.get(`${apiUrl}/refund/my-refunds`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lấy danh sách hoàn tiền thất bại:", error);
            throw error;
        }
    },

    // Xem chi tiết yêu cầu hoàn tiền
    getRefundDetails: async (accessToken, refundId) => {
        try {
            const response = await axiosJWT.get(
                `${apiUrl}/refund/details/${refundId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Lấy chi tiết hoàn tiền thất bại:", error);
            throw error;
        }
    },

    // Admin lấy tất cả yêu cầu hoàn tiền
    getAllRefunds: async (accessToken) => {
        try {
            const response = await axiosJWT.get(`${apiUrl}/refund/all`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lấy danh sách hoàn tiền thất bại:", error);
            throw error;
        }
    },

    // Admin phê duyệt yêu cầu hoàn tiền
    approveRefund: async (accessToken, refundId, adminNote) => {
        try {
            const response = await axiosJWT.patch(
                `${apiUrl}/refund/approve/${refundId}`,
                { adminNote },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Phê duyệt hoàn tiền thất bại:", error);
            throw error;
        }
    },

    // Admin từ chối yêu cầu hoàn tiền
    rejectRefund: async (accessToken, refundId, reason) => {
        try {
            const response = await axiosJWT.patch(
                `${apiUrl}/refund/reject/${refundId}`,
                { reason },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Từ chối hoàn tiền thất bại:", error);
            throw error;
        }
    },
};

export default refundService; 