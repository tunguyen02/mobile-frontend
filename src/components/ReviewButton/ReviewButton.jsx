import React, { useState, useEffect } from 'react';
import { Button, Modal, notification } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import ReviewForm from '../ReviewForm/ReviewForm';
import axios from 'axios';
import { handleGetAccessToken } from '../../services/axiosJWT';

const ReviewButton = ({ product, orderId }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [loading, setLoading] = useState(false);

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này trong đơn hàng chưa
    useEffect(() => {
        const checkReviewStatus = async () => {
            try {
                setLoading(true);
                const accessToken = handleGetAccessToken();
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/review/check`, 
                    {
                        params: {
                            productId: product._id,
                            orderId: orderId
                        },
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                );
                setHasReviewed(response.data.hasReviewed);
            } catch (error) {
                console.error('Không thể kiểm tra trạng thái đánh giá:', error);
            } finally {
                setLoading(false);
            }
        };

        checkReviewStatus();
    }, [product._id, orderId]);

    const showModal = () => {
        setModalVisible(true);
    };

    const handleCancel = () => {
        setModalVisible(false);
    };

    return (
        <>
            <Button
                type="primary"
                icon={<StarOutlined />}
                onClick={showModal}
                disabled={hasReviewed}
                loading={loading}
                className={hasReviewed ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
            >
                {hasReviewed ? 'Đã đánh giá' : 'Đánh giá'}
            </Button>

            <Modal
                title={<div className="text-xl font-bold">Đánh giá sản phẩm</div>}
                open={modalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
            >
                <ReviewForm
                    product={product}
                    orderId={orderId}
                    onClose={handleCancel}
                />
            </Modal>
        </>
    );
};

export default ReviewButton; 