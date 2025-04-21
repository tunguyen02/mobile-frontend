import { Popover, Button } from "antd";
import CustomBrandCheckbox from "./CustomBrandCheckbox";
import { useEffect, useState } from "react";
import { DownOutlined } from "@ant-design/icons";

const BrandSelector = ({ brands, brandsFilter, setBrandsFilter }) => {
    const [selectedBrands, setSelectedBrands] = useState(brandsFilter);
    const [isPopoverVisible, setIsPopoverVisible] = useState(false);

    const handleClearSelection = () => {
        setSelectedBrands([]);
    };

    const handleApplySelection = () => {
        setBrandsFilter(selectedBrands);
        setIsPopoverVisible(false); // Đóng popup sau khi nhấn "Xem kết quả"
    };

    const content = (
        <>
            <div className="grid grid-cols-3 gap-4">
                {brands.map((brand) => (
                    <CustomBrandCheckbox
                        key={brand?._id}
                        label={brand?.name}
                        handleBrandsChange={setSelectedBrands}
                        checked={selectedBrands?.includes(brand?.name)}
                    />
                ))}
            </div>
            <div className="flex justify-end mt-8 gap-3">
                <Button
                    onClick={handleClearSelection}
                    style={{ borderColor: "#1e90ff", color: "#1e90ff" }}
                >
                    Bỏ chọn
                </Button>
                <Button
                    type="primary"
                    style={{ backgroundColor: "#1e90ff", borderColor: "#1e90ff" }}
                    onClick={handleApplySelection}
                >
                    Xem kết quả
                </Button>
            </div>
        </>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            placement="rightBottom"
            open={isPopoverVisible}
            onOpenChange={(visible) => setIsPopoverVisible(visible)}
        >
            <Button className="font-bold">Hãng sản xuất <DownOutlined /></Button>
        </Popover>
    );
};

export default BrandSelector;
