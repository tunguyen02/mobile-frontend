import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, Avatar, Rate, Button, Empty, Pagination, Spin, Typography, Space, Modal, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { handleGetAccessToken } from '../../services/axiosJWT';
import ReviewForm from '../ReviewForm/ReviewForm';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;

const ProductReviews = ({ productId }) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentReview, setCurrentReview] = useState(null);
    const user = useSelector((state) => state.user.user);

    // Lấy danh sách đánh giá sản phẩm
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['product-reviews', productId, page, limit],
        queryFn: async () => {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/review/product/${productId}`,
                { params: { page, limit } }
            );
            return response.data;
        },
        enabled: !!productId,
        refetchOnWindowFocus: false,
    });

    const handleEditReview = (review) => {
        setCurrentReview(review);
        setEditModalVisible(true);
    };

    const handleCloseEditModal = () => {
        setEditModalVisible(false);
        setCurrentReview(null);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Kiểm tra người dùng đã mua sản phẩm này chưa
    const { data: userCanReview, isLoading: checkingPurchase } = useQuery({
        queryKey: ['user-can-review', productId],
        queryFn: async () => {
            if (!user) return { canReview: false };

            try {
                const accessToken = handleGetAccessToken();
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/review/user-can-review`,
                    {
                        params: { productId },
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }
                );
                return response.data;
            } catch (error) {
                console.error("Lỗi kiểm tra quyền đánh giá:", error);
                return { canReview: false };
            }
        },
        enabled: !!user && !!productId,
        refetchOnWindowFocus: false,
    });

    // Format thời gian
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return <Spin size="large" />;
    }

    const reviews = data?.data || [];
    const pagination = data?.pagination || {};
    const averageRating = data?.averageRating || 0;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Rate disabled allowHalf value={averageRating} className="text-yellow-500" />
                    <Text className="ml-2 text-white">{averageRating.toFixed(1)}/5</Text>
                    <Text className="ml-2 text-gray-400">({pagination.total} đánh giá)</Text>
                </div>
            </div>

            {reviews.length > 0 ? (
                <>
                    <div className="space-y-4">
                        {reviews.map((review) => {
                            const isCurrentUserReview = user && review.user._id === user._id;

                            return (
                                <div key={review._id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center mb-3">
                                        <Avatar
                                            src={review.user.avatarUrl || 'https://joeschmoe.io/api/v1/random'}
                                            size={40}
                                        />
                                        <div className="ml-3">
                                            <div className="flex items-center">
                                                <Text strong className="text-white">{review.user.name}</Text>
                                                {review.isVerifiedPurchase && (
                                                    <Tag color="green" className="ml-2 text-xs">Đã mua hàng</Tag>
                                                )}
                                            </div>
                                            <Rate disabled allowHalf value={review.rating} className="text-yellow-500 text-sm" />
                                        </div>
                                    </div>

                                    <div className="text-white my-3">{review.content}</div>

                                    <div className="flex justify-between items-center mt-2">
                                        <Text className="text-gray-400">{formatDate(review.createdAt)}</Text>
                                        {isCurrentUserReview && (
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => handleEditReview(review)}
                                                className="bg-blue-600 hover:bg-blue-700 border-0"
                                            >
                                                Chỉnh sửa
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center mt-6">
                        <Pagination
                            current={page}
                            total={pagination.total}
                            pageSize={limit}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            className="text-white"
                        />
                    </div>
                </>
            ) : (
                <Empty description={<span className="text-gray-400">Sản phẩm chưa có đánh giá nào</span>} />
            )}

            {/* Modal chỉnh sửa đánh giá */}
            {currentReview && (
                <Modal
                    title="Chỉnh sửa đánh giá"
                    open={editModalVisible}
                    onCancel={handleCloseEditModal}
                    footer={null}
                    width={600}
                >
                    <ReviewForm
                        product={{ _id: productId, name: currentReview.product.name }}
                        orderId={currentReview.order}
                        reviewId={currentReview._id}
                        initialValues={{
                            rating: currentReview.rating,
                            content: currentReview.content
                        }}
                        isEdit={true}
                        onClose={handleCloseEditModal}
                        onSuccess={refetch}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ProductReviews; 