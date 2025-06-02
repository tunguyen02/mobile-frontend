import React, { useState, useEffect } from 'react';
import { Popover, Button, Slider, InputNumber } from 'antd';
import { formatCurrency } from "../../utils/utils";

const PriceFilterButton = ({ filters, setFilters }) => {
    const [popoverVisible, setPopoverVisible] = useState(false);
    const [inputPriceMin, setInputPriceMin] = useState(0);
    const [inputPriceMax, setInputPriceMax] = useState(60000000);

    const priceMarks = {
        0: '0đ',
        10000000: '10tr',
        20000000: '20tr',
        30000000: '30tr',
        40000000: '40tr',
        50000000: '50tr',
        60000000: '60tr'
    };

    // Cập nhật giá trị tạm thời khi popover mở
    const handlePopoverOpen = (visible) => {
        if (visible && filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            setInputPriceMin(min);
            setInputPriceMax(max);
        } else if (visible) {
            setInputPriceMin(0);
            setInputPriceMax(60000000);
        } else {
            // Khi đóng popover, cập nhật filter tạm thời vào state chính
            let updatedPriceRange = '';
            if (inputPriceMin > 0 || inputPriceMax < 60000000) {
                updatedPriceRange = `${inputPriceMin}-${inputPriceMax}`;
            }
            setFilters(prev => ({
                ...prev,
                priceRange: updatedPriceRange
            }));
        }
        setPopoverVisible(visible);
    };

    const content = (
        <div className="w-[300px] p-4">
            <Slider
                range
                min={0}
                max={60000000}
                step={500000}
                marks={priceMarks}
                value={[inputPriceMin, inputPriceMax]}
                onChange={(values) => {
                    setInputPriceMin(values[0]);
                    setInputPriceMax(values[1]);
                }}
            />
            <div className="flex justify-between mt-4">
                <InputNumber
                    style={{ width: '45%' }}
                    min={0}
                    max={60000000}
                    step={500000}
                    value={inputPriceMin}
                    onChange={(value) => setInputPriceMin(value)}
                    formatter={(value) => formatCurrency(value)}
                    parser={(value) => value.replace(/\D/g, '')}
                />
                <span className="mx-2 self-center">-</span>
                <InputNumber
                    style={{ width: '45%' }}
                    min={0}
                    max={60000000}
                    step={500000}
                    value={inputPriceMax}
                    onChange={(value) => setInputPriceMax(value)}
                    formatter={(value) => formatCurrency(value)}
                    parser={(value) => value.replace(/\D/g, '')}
                />
            </div>
        </div>
    );

    // Hiển thị giá đã chọn
    const getPriceRangeText = () => {
        if (!filters.priceRange) return "";
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (min === 0 && max === 60000000) return "";
        if (min === 0) return `Dưới ${formatCurrency(max)}đ`;
        if (max === 60000000) return `Trên ${formatCurrency(min)}đ`;
        return `${formatCurrency(min)}đ - ${formatCurrency(max)}đ`;
    };

    const priceRangeText = getPriceRangeText();

    return (
        <Popover
            content={content}
            title={<div className="text-center">Khoảng giá</div>}
            trigger="click"
            open={popoverVisible}
            onOpenChange={handlePopoverOpen}
            placement="bottomLeft"
            overlayStyle={{ width: '320px' }}
        >
            <Button
                className={`mr-2 flex items-center ${filters.priceRange ? 'bg-blue-100' : ''}`}
            >
                <span>
                    Giá {priceRangeText ? `(${priceRangeText})` : ''}
                </span>
            </Button>
        </Popover>
    );
};

export default PriceFilterButton; 