import React, { useState, useEffect } from 'react';
import { Popover, Button, Checkbox } from 'antd';

const BrandFilterButton = ({ brands = [], filters, setFilters }) => {
    const [popoverVisible, setPopoverVisible] = useState(false);
    const [tempSelectedBrands, setTempSelectedBrands] = useState(filters.selectedBrands || []);

    // Debug log
    useEffect(() => {
        console.log("BrandFilterButton received brands:", brands);
        console.log("BrandFilterButton brands type:", typeof brands);
        console.log("BrandFilterButton brands isArray:", Array.isArray(brands));
        if (Array.isArray(brands)) {
            console.log("BrandFilterButton brands length:", brands.length);
        }
    }, [brands]);

    // Cập nhật giá trị tạm thời khi popover mở
    const handlePopoverOpen = (visible) => {
        if (visible) {
            setTempSelectedBrands(filters.selectedBrands || []);
        } else {
            // Khi đóng popover, cập nhật filter tạm thời vào state chính
            setFilters(prev => ({
                ...prev,
                selectedBrands: tempSelectedBrands
            }));
        }
        setPopoverVisible(visible);
    };

    const handleBrandChange = (brand, checked) => {
        if (checked) {
            setTempSelectedBrands([...tempSelectedBrands, brand.name]);
        } else {
            setTempSelectedBrands(tempSelectedBrands.filter(b => b !== brand.name));
        }
    };

    const content = (
        <div className="w-[300px] max-h-[400px] overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-2">
                {brands && brands.length > 0 ? (
                    brands.map((brand) => (
                        <Checkbox
                            key={brand._id}
                            onChange={(e) => handleBrandChange(brand, e.target.checked)}
                            checked={tempSelectedBrands.includes(brand.name)}
                        >
                            {brand.name}
                        </Checkbox>
                    ))
                ) : (
                    <div>Không có thương hiệu</div>
                )}
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            title={<div className="text-center">Hãng sản xuất</div>}
            trigger="click"
            open={popoverVisible}
            onOpenChange={handlePopoverOpen}
            placement="bottomLeft"
            overlayStyle={{ width: '300px' }}
        >
            <Button
                className={`mr-2 flex items-center ${filters.selectedBrands.length > 0 ? 'bg-blue-100' : ''}`}
            >
                <span>
                    Hãng sản xuất {filters.selectedBrands.length > 0 ? `(${filters.selectedBrands.length})` : ''}
                </span>
            </Button>
        </Popover>
    );
};

export default BrandFilterButton; 