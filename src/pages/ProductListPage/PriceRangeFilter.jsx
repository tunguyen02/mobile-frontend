import React, { useState, useEffect } from "react";
import { Slider, InputNumber, Space, Button, Popover } from "antd";
import { formatCurrency } from "../../utils/utils";

const PriceRangeFilter = ({ priceRange, setPriceRange }) => {
    // Giá tối thiểu và tối đa (VND)
    const MIN_PRICE = 0;
    const MAX_PRICE = 60000000;
    const STEP = 500000; // Khoảng cách 500.000 VND

    // State tạm thời cho giá trị được hiển thị và chỉnh sửa
    const [tempMinPrice, setTempMinPrice] = useState(MIN_PRICE);
    const [tempMaxPrice, setTempMaxPrice] = useState(MAX_PRICE);
    const [popoverVisible, setPopoverVisible] = useState(false);

    // Khởi tạo giá trị ban đầu từ URL params nếu có
    useEffect(() => {
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(price => parseInt(price));
            if (!isNaN(min) && !isNaN(max)) {
                setTempMinPrice(min);
                setTempMaxPrice(max);
            }
        }
    }, []);

    // Xử lý khi thanh trượt thay đổi - chỉ cập nhật state tạm thời
    const handleSliderChange = (values) => {
        setTempMinPrice(values[0]);
        setTempMaxPrice(values[1]);
    };

    // Xử lý khi nhấn nút áp dụng
    const handleApplyFilter = () => {
        setPriceRange(`${tempMinPrice}-${tempMaxPrice}`);
        setPopoverVisible(false);
    };

    // Xử lý khi input min thay đổi
    const handleMinInputChange = (value) => {
        if (value === null) return;
        const newMinPrice = Math.max(MIN_PRICE, value);
        setTempMinPrice(newMinPrice);
    };

    // Xử lý khi input max thay đổi
    const handleMaxInputChange = (value) => {
        if (value === null) return;
        const newMaxPrice = Math.min(MAX_PRICE, value);
        setTempMaxPrice(newMaxPrice);
    };

    // Format giá trị hiển thị trên thanh trượt
    const formatTooltip = (value) => {
        return `${formatCurrency(value)} đ`;
    };

    // Nội dung của popover
    const popoverContent = (
        <div className="w-[350px] p-3">
            <div className="mb-4">
                <Slider
                    range
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={STEP}
                    value={[tempMinPrice, tempMaxPrice]}
                    onChange={handleSliderChange}
                    tooltip={{ formatter: formatTooltip }}
                    trackStyle={[{ backgroundColor: '#3B82F6' }]}
                    handleStyle={[
                        { backgroundColor: 'white', borderColor: '#3B82F6', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' },
                        { backgroundColor: 'white', borderColor: '#3B82F6', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' }
                    ]}
                    railStyle={{ backgroundColor: '#4B5563' }}
                />
            </div>
            <div className="flex justify-between items-center">
                <Space className="flex justify-between">
                    <InputNumber
                        min={MIN_PRICE}
                        max={tempMaxPrice - STEP}
                        value={tempMinPrice}
                        onChange={handleMinInputChange}
                        step={STEP}
                        formatter={(value) => `${formatCurrency(value)}`}
                        parser={(value) => value.replace(/\D/g, '')}
                        style={{ width: '120px' }}
                        controls={false}
                        className="rounded-md"
                    />
                    <span>-</span>
                    <InputNumber
                        min={tempMinPrice + STEP}
                        max={MAX_PRICE}
                        value={tempMaxPrice}
                        onChange={handleMaxInputChange}
                        step={STEP}
                        formatter={(value) => `${formatCurrency(value)}`}
                        parser={(value) => value.replace(/\D/g, '')}
                        style={{ width: '120px' }}
                        controls={false}
                        className="rounded-md"
                    />
                </Space>
            </div>
        </div>
    );

    return (
        <div className="flex items-center">
            <Popover
                content={popoverContent}
                title={<div className="text-center">Chọn khoảng giá</div>}
                trigger="click"
                open={popoverVisible}
                onOpenChange={(visible) => setPopoverVisible(visible)}
                placement="bottomLeft"
                overlayStyle={{ width: '350px' }}
            >
                <Button className="mr-2 flex items-center">
                    <span>
                        {priceRange
                            ? `${formatCurrency(priceRange.split('-')[0])} - ${formatCurrency(priceRange.split('-')[1])}`
                            : "Chọn giá"}
                    </span>
                </Button>
            </Popover>
            <Button
                type="primary"
                onClick={handleApplyFilter}
                className="bg-blue-500 hover:bg-blue-600 border-none"
            >
                Lọc
            </Button>
        </div>
    );
};

export default PriceRangeFilter; 