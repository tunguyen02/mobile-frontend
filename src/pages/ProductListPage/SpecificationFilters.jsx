import React, { useState, useEffect } from "react";
import { Checkbox, Popover, Button, Divider, Collapse, Radio } from "antd";
import productService from "../../services/productService";
import { useQuery } from "@tanstack/react-query";

const { Panel } = Collapse;

const SpecificationFilters = ({
    selectedBattery, setSelectedBattery,
    selectedCamera, setSelectedCamera,
    selectedStorage, setSelectedStorage,
    selectedRam, setSelectedRam,
    selectedOS, setSelectedOS
}) => {
    const [popoverVisible, setPopoverVisible] = useState(false);

    // Lấy dữ liệu thông số kỹ thuật từ API
    const { data: batteryCapacities = [], isLoading: isBatteryLoading } = useQuery({
        queryKey: ["batteryCapacities"],
        queryFn: () => productService.getDistinctBatteryCapacities(),
        enabled: true,
        select: (data) => data.data || [],
    });

    const { data: cameraSpecs = [], isLoading: isCameraLoading } = useQuery({
        queryKey: ["cameraSpecs"],
        queryFn: () => productService.getDistinctCameraSpecs(),
        enabled: true,
        select: (data) => data.data || [],
    });

    const { data: storageOptions = [], isLoading: isStorageLoading } = useQuery({
        queryKey: ["storageOptions"],
        queryFn: () => productService.getDistinctStorageOptions(),
        enabled: true,
        select: (data) => data.data || [],
    });

    // Giá trị mặc định cho RAM và OS nếu API không có
    const ramOptions = ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"];
    const osOptions = ["Android", "iOS", "HarmonyOS", "Windows"];

    // Định nghĩa các khoảng dung lượng pin
    const batteryRanges = [
        { value: "0-3000", label: "Dưới 3000 mAh" },
        { value: "3000-4000", label: "3000 mAh - 4000 mAh" },
        { value: "4000-5000", label: "4000 mAh - 5000 mAh" },
        { value: "5000-", label: "Trên 5000 mAh" }
    ];

    // Định nghĩa các khoảng camera
    const cameraRanges = [
        { value: "0-12", label: "Dưới 12MP" },
        { value: "12-20", label: "12MP - 20MP" },
        { value: "20-48", label: "20MP - 48MP" },
        { value: "48-108", label: "48MP - 108MP" },
        { value: "108-", label: "Trên 108MP" }
    ];

    const handleApplyFilters = () => {
        setPopoverVisible(false);
    };

    const handleBatteryRangeChange = (e) => {
        setSelectedBattery([e.target.value]);
    };

    const handleCameraRangeChange = (e) => {
        setSelectedCamera([e.target.value]);
    };

    const getStorageLabel = (storage) => {
        return storage.replace(/GB/i, "").trim() + " GB";
    };

    const content = (
        <div className="w-[350px] max-h-[400px] overflow-y-auto p-2">
            <Collapse defaultActiveKey={['1']} ghost>
                <Panel header="Dung lượng pin" key="1">
                    <Radio.Group
                        onChange={handleBatteryRangeChange}
                        value={selectedBattery.length > 0 ? selectedBattery[0] : null}
                    >
                        <div className="flex flex-col gap-2">
                            {batteryRanges.map((range) => (
                                <Radio key={range.value} value={range.value}>
                                    {range.label}
                                </Radio>
                            ))}
                        </div>
                    </Radio.Group>
                </Panel>

                <Panel header="Camera" key="2">
                    <Radio.Group
                        onChange={handleCameraRangeChange}
                        value={selectedCamera.length > 0 ? selectedCamera[0] : null}
                    >
                        <div className="flex flex-col gap-2">
                            {cameraRanges.map((range) => (
                                <Radio key={range.value} value={range.value}>
                                    {range.label}
                                </Radio>
                            ))}
                        </div>
                    </Radio.Group>
                </Panel>

                <Panel header="Bộ nhớ trong" key="3">
                    <div className="grid grid-cols-2 gap-2">
                        {storageOptions.map((storage) => (
                            <Checkbox
                                key={storage}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedStorage([...selectedStorage, storage]);
                                    } else {
                                        setSelectedStorage(selectedStorage.filter(s => s !== storage));
                                    }
                                }}
                                checked={selectedStorage.includes(storage)}
                            >
                                {getStorageLabel(storage)}
                            </Checkbox>
                        ))}
                    </div>
                </Panel>

                <Panel header="RAM" key="4">
                    <div className="grid grid-cols-2 gap-2">
                        {ramOptions.map((ram) => (
                            <Checkbox
                                key={ram}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRam([...selectedRam, ram]);
                                    } else {
                                        setSelectedRam(selectedRam.filter(r => r !== ram));
                                    }
                                }}
                                checked={selectedRam.includes(ram)}
                            >
                                {ram}
                            </Checkbox>
                        ))}
                    </div>
                </Panel>

                <Panel header="Hệ điều hành" key="5">
                    <div className="grid grid-cols-2 gap-2">
                        {osOptions.map((os) => (
                            <Checkbox
                                key={os}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedOS([...selectedOS, os]);
                                    } else {
                                        setSelectedOS(selectedOS.filter(o => o !== os));
                                    }
                                }}
                                checked={selectedOS.includes(os)}
                            >
                                {os}
                            </Checkbox>
                        ))}
                    </div>
                </Panel>
            </Collapse>

            <Divider style={{ margin: '8px 0' }} />

            <div className="flex justify-end">
                <Button type="primary" onClick={handleApplyFilters} className="bg-blue-500 hover:bg-blue-600 border-none">
                    Áp dụng
                </Button>
            </div>
        </div>
    );

    // Kiểm tra có filter nào được chọn không
    const hasSelectedFilters = selectedBattery.length > 0 ||
        selectedCamera.length > 0 ||
        selectedStorage.length > 0 ||
        selectedRam.length > 0 ||
        selectedOS.length > 0;

    return (
        <div>
            <Popover
                content={content}
                title={<div className="text-center">Bộ lọc chi tiết</div>}
                trigger="click"
                open={popoverVisible}
                onOpenChange={(visible) => setPopoverVisible(visible)}
                placement="bottomLeft"
                overlayStyle={{ width: '350px' }}
            >
                <Button
                    className={`mr-2 flex items-center ${hasSelectedFilters ? 'bg-blue-100' : ''}`}
                >
                    <span>
                        Thông số kỹ thuật {hasSelectedFilters ? `(${selectedBattery.length + selectedCamera.length + selectedStorage.length + selectedRam.length + selectedOS.length})` : ''}
                    </span>
                </Button>
            </Popover>
        </div>
    );
};

export default SpecificationFilters; 