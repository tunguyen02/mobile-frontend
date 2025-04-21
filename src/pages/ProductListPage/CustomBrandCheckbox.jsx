import React, { useEffect, useState } from 'react';

const CustomBrandCheckbox = ({ label, handleBrandsChange, checked }) => {
    const handleToggle = () => {
        if (checked) {
            handleBrandsChange((prev) => prev.filter((item) => item !== label));
        } else {
            handleBrandsChange((prev) => [...prev, label]);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`relative w-28 h-10 border rounded-md flex items-center justify-center
        ${checked ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-800'}`}
        >
            {label}
            {checked && (
                <div className="absolute top-0 right-0 w-5 h-5 bg-blue-500 text-white rounded-tl-md flex items-center justify-center text-xs">
                    ✓
                </div>
            )}
        </button>
    );
};

export default CustomBrandCheckbox;