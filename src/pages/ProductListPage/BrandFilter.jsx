import React, { useState, useEffect } from 'react';
import { Popover, Button, Checkbox, Divider } from 'antd';

const BrandFilter = ({ brands = [], selectedBrands, setSelectedBrands }) => {
    const [popoverVisible, setPopoverVisible] = useState(false);

    useEffect(() => {
        console.log("BrandFilter received brands:", brands);
        console.log("BrandFilter selected brands:", selectedBrands);
    }, [brands, selectedBrands]);

    const handleBrandChange = (brand, checked) => {
        console.log(`Brand ${brand.name} checked: ${checked}`);
        if (checked) {
            setSelectedBrands([...selectedBrands, brand.name]);
        } else {
            setSelectedBrands(selectedBrands.filter(b => b !== brand.name));
        }
    };

    const handleApplyFilters = () => {
        console.log("Applying brand filters:", selectedBrands);
        setPopoverVisible(false);
    };

    const content = (
        <div className="w-[300px] max-h-[400px] overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-2">
                {brands && brands.length > 0 ? (
                    brands.map((brand) => (
                        <Checkbox
                            key={brand._id}
                            onChange={(e) => handleBrandChange(brand, e.target.checked)}
                            checked={selectedBrands.includes(brand.name)}
                        >
                            {brand.name}
                        </Checkbox>
                    ))
                ) : (
                    <div>Không có thương hiệu</div>
                )}
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div className="flex justify-end">
                <Button
                    type="primary"
                    onClick={handleApplyFilters}
                    className="bg-blue-500 hover:bg-blue-600 border-none"
                >
                    Áp dụng
                </Button>
            </div>
        </div>
    );

    return (
        <div>
            <Popover
                content={content}
                title={<div className="text-center">Hãng sản xuất</div>}
                trigger="click"
                open={popoverVisible}
                onOpenChange={(visible) => setPopoverVisible(visible)}
                placement="bottomLeft"
                overlayStyle={{ width: '300px' }}
            >
                <Button
                    className={`mr-2 flex items-center ${selectedBrands.length > 0 ? 'bg-blue-100' : ''}`}
                >
                    <span>
                        Hãng sản xuất {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}
                    </span>
                </Button>
            </Popover>
        </div>
    );
};

export default BrandFilter; 