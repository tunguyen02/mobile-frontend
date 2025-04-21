import axiosJWT from "./axiosJWT";

const apiUrl = import.meta.env.VITE_API_URL;

const reviewService = {
    createReview: async (accessToken, productId, orderId, rating, content) => {
        try {
            const response = await axiosJWT.post(
                `${apiUrl}/review/create`,
                { productId, orderId, rating, content },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Gửi đánh giá thất bại:", error);
            throw error.response?.data || { message: 'Lỗi kết nối server' };
        }
    },

    getProductReviews: async (productId, page = 1, limit = 5) => {
        try {
            const response = await axiosJWT.get(
                `${apiUrl}/review/product/${productId}?page=${page}&limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error("Lấy đánh giá thất bại:", error);
            throw error.response?.data || { message: 'Lỗi kết nối server' };
        }
    },

    updateReview: async (accessToken, reviewId, data) => {
        try {
            const response = await axiosJWT.put(
                `${apiUrl}/review/update/${reviewId}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Cập nhật đánh giá thất bại:", error);
            throw error.response?.data || { message: 'Lỗi kết nối server' };
        }
    },

    deleteReview: async (accessToken, reviewId) => {
        try {
            const response = await axiosJWT.delete(
                `${apiUrl}/review/delete/${reviewId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error("Xóa đánh giá thất bại:", error);
            throw error.response?.data || { message: 'Lỗi kết nối server' };
        }
    }
};

export default reviewService; 