import React, { useState } from 'react';
import { Form, Input, Button, Rate, notification, Modal } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { handleGetAccessToken } from '../../services/axiosJWT';
import axios from 'axios';

const { TextArea } = Input;

const ReviewForm = ({ product, orderId, reviewId, initialValues, isEdit = false, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const submitReview = async (values) => {
        try {
            setSubmitting(true);
            const accessToken = handleGetAccessToken();
            
            if (isEdit) {
                // Cập nhật đánh giá
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/review/update/${reviewId}`,
                    {
                        rating: values.rating,
                        content: values.content,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                notification.success({
                    message: 'Cập nhật đánh giá thành công',
                    description: 'Đánh giá của bạn đã được cập nhật!',
                });
            } else {
                // Tạo đánh giá mới
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/review/create`,
                    {
                        productId: product._id,
                        orderId: orderId,
                        rating: values.rating,
                        content: values.content,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                notification.success({
                    message: 'Đánh giá thành công',
                    description: 'Cảm ơn bạn đã đánh giá sản phẩm!',
                });
            }
            
            // Cập nhật lại dữ liệu review và chi tiết sản phẩm
            queryClient.invalidateQueries(['product-details', product._id]);
            queryClient.invalidateQueries(['product-reviews', product._id]);
            
            // Nếu có callback onSuccess, gọi nó
            if (onSuccess) {
                onSuccess();
            }
            
            form.resetFields();
            onClose();
        } catch (error) {
            notification.error({
                message: isEdit ? 'Cập nhật đánh giá thất bại' : 'Đánh giá thất bại',
                description: error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={submitReview}
            initialValues={initialValues || { rating: 5 }}
        >
            <Form.Item
                name="productName"
                label="Sản phẩm"
                initialValue={product.name}
            >
                <Input disabled />
            </Form.Item>
            
            <Form.Item
                name="rating"
                label="Đánh giá"
                rules={[{ required: true, message: 'Vui lòng chọn số sao đánh giá!' }]}
            >
                <Rate allowHalf />
            </Form.Item>
            
            <Form.Item
                name="content"
                label="Nhận xét của bạn"
                rules={[
                    { required: true, message: 'Vui lòng nhập nhận xét của bạn!' },
                    { min: 10, message: 'Nhận xét phải có ít nhất 10 ký tự!' }
                ]}
            >
                <TextArea
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    maxLength={500}
                    showCount
                />
            </Form.Item>
            
            <Form.Item className="text-right">
                <Button 
                    onClick={onClose} 
                    style={{ marginRight: 8 }}
                >
                    Hủy
                </Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={submitting}
                >
                    {isEdit ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ReviewForm; 