import { TruckOutlined } from '@ant-design/icons'
import { Col, Divider, Grid, Row } from 'antd'
import React from 'react'
import { formatCurrency } from '../../utils/utils'
import { useNavigate } from 'react-router-dom'

function OrderCard({ order }) {
    const navigate = useNavigate();

    const shippingStatusMap = {
        'Pending': 'Đang chờ xử lý',
        'Shipping': 'Đang vận chuyển',
        'Completed': 'Giao hàng thành công'
    }

    const handleProductDetails = (productId) => {
        navigate(`/product/product-details/${productId}`);
    }

    const handleOrderDetails = (orderId) => {
        navigate(`/order/details/${orderId}`);
    }

    return (
        <div className='rounded-lg bg-white px-10 py-8 text-black'>
            <div>
                <div className='text-gray-500'>
                    <TruckOutlined /> {shippingStatusMap[order?.shippingStatus]}
                </div>
                <Divider />
            </div>
            {order.products.map(item => (
                <Row key={item?.product?._id} className='mb-4'>
                    <Col span={14} className='flex items-center'>
                        <img className="cursor-pointer" src={item?.product?.imageUrl[0]} alt={item?.product?.name} width='100px' onClick={() => handleProductDetails(item?.product?._id)} />
                        <div className='flex flex-col gap-3'>
                            <div className='text-base text-black hover:text-sky-500 cursor-pointer' onClick={() => { handleProductDetails(item?.product?._id) }}>
                                {item?.product?.name}
                            </div>
                            <div className='text-sm text-zinc-500'>{item?.product?.color}</div>
                        </div>
                    </Col>
                    <Col span={5} className='flex items-center'>
                        <div className='text-base text-black'>{item?.quantity}</div>
                    </Col>
                    <Col span={5} className='flex items-center justify-end'>
                        <div className='text-base text-black'>{formatCurrency(item?.price * item?.quantity)}<sup>₫</sup></div>
                    </Col>
                </Row>
            ))}
            <Divider />
            <div className='flex justify-end gap-2'>
                <span className='font-bold text-black text-lg'>Tổng tiền: </span>
                <span className='font-bold text-red-600 text-lg'>{formatCurrency(order?.totalPrice)}<sup>₫</sup></span>
            </div>
            <div className='flex justify-end mt-3'>
                <button className='rounded-md border-sky-500 text-base border text-sky-500 px-2 py-1' onClick={() => { handleOrderDetails(order?._id) }}>Xem chi tiết</button>
            </div>
        </div>
    )
}

export default OrderCard;