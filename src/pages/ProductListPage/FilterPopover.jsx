import React, { useState } from 'react';
import { Button } from 'antd';

const FilterPopover = ({ filters, onClick }) => {
    const [isApplying, setIsApplying] = useState(false);

    // Hàm xử lý khi nhấn nút lọc
    const handleApplyFilters = () => {
        setIsApplying(true);
        // Gọi hàm từ props để áp dụng filter
        onClick();

        // Reset trạng thái sau khi áp dụng
        setTimeout(() => setIsApplying(false), 500);
    };

    // Kiểm tra có bất kỳ bộ lọc nào được áp dụng
    const hasActiveFilters =
        (filters.selectedBrands?.length > 0) ||
        filters.priceRange ||
        (filters.selectedBattery?.length > 0) ||
        (filters.selectedCamera?.length > 0) ||
        (filters.selectedStorage?.length > 0) ||
        (filters.selectedRam?.length > 0) ||
        (filters.selectedOS?.length > 0);

    // Tổng số filter đã áp dụng
    const totalActiveFilters =
        (filters.selectedBrands?.length || 0) +
        (filters.priceRange ? 1 : 0) +
        (filters.selectedBattery?.length || 0) +
        (filters.selectedCamera?.length || 0) +
        (filters.selectedStorage?.length || 0) +
        (filters.selectedRam?.length || 0) +
        (filters.selectedOS?.length || 0);

    return (
        <Button
            type="primary"
            onClick={handleApplyFilters}
            loading={isApplying}
            className={`${hasActiveFilters ? 'bg-blue-500' : 'bg-gray-500'} hover:bg-blue-600 border-none`}
        >
            Lọc {totalActiveFilters > 0 ? `(${totalActiveFilters})` : ''}
        </Button>
    );
};

export default FilterPopover; 