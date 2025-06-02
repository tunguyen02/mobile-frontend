import React, { useState } from 'react';
import { Popover, Button, Collapse, Radio, Checkbox } from 'antd';
import { useQuery } from "@tanstack/react-query";
import productService from "../../services/productService";

const { Panel } = Collapse;

const SpecificationsFilterButton = ({ filters, setFilters }) => {
    const [popoverVisible, setPopoverVisible] = useState(false);
    const [tempSpecs, setTempSpecs] = useState({
        selectedBattery: filters.selectedBattery || [],
        selectedCamera: filters.selectedCamera || [],
        selectedStorage: filters.selectedStorage || [],
        selectedRam: filters.selectedRam || [],
        selectedOS: filters.selectedOS || []
    });

    // API calls để lấy dữ liệu thông số kỹ thuật
    const { data: storageOptions = [] } = useQuery({
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

    // Cập nhật giá trị tạm thời khi popover mở
    const handlePopoverOpen = (visible) => {
        if (visible) {
            setTempSpecs({
                selectedBattery: filters.selectedBattery || [],
                selectedCamera: filters.selectedCamera || [],
                selectedStorage: filters.selectedStorage || [],
                selectedRam: filters.selectedRam || [],
                selectedOS: filters.selectedOS || []
            });
        } else {
            // Khi đóng popover, cập nhật filter tạm thời vào state chính
            setFilters(prev => ({
                ...prev,
                selectedBattery: tempSpecs.selectedBattery,
                selectedCamera: tempSpecs.selectedCamera,
                selectedStorage: tempSpecs.selectedStorage,
                selectedRam: tempSpecs.selectedRam,
                selectedOS: tempSpecs.selectedOS
            }));
        }
        setPopoverVisible(visible);
    };

    // Tính tổng số thông số đã chọn
    const getTotalSpecsSelected = () => {
        return (
            (filters.selectedBattery?.length || 0) +
            (filters.selectedCamera?.length || 0) +
            (filters.selectedStorage?.length || 0) +
            (filters.selectedRam?.length || 0) +
            (filters.selectedOS?.length || 0)
        );
    };

    const content = (
        <div className="w-[350px] max-h-[450px] overflow-y-auto p-2">
            <Collapse defaultActiveKey={['1']} ghost>
                <Panel header="Dung lượng pin" key="1">
                    <Radio.Group
                        value={tempSpecs.selectedBattery[0] || null}
                        onChange={(e) => setTempSpecs({ ...tempSpecs, selectedBattery: [e.target.value] })}
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
                        value={tempSpecs.selectedCamera[0] || null}
                        onChange={(e) => setTempSpecs({ ...tempSpecs, selectedCamera: [e.target.value] })}
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
                                checked={tempSpecs.selectedStorage.includes(storage)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setTempSpecs({
                                            ...tempSpecs,
                                            selectedStorage: [...tempSpecs.selectedStorage, storage]
                                        });
                                    } else {
                                        setTempSpecs({
                                            ...tempSpecs,
                                            selectedStorage: tempSpecs.selectedStorage.filter(s => s !== storage)
                                        });
                                    }
                                }}
                            >
                                {storage.replace(/GB/i, "").trim() + " GB"}
                            </Checkbox>
                        ))}
                    </div>
                </Panel>

                <Panel header="RAM" key="4">
                    <div className="grid grid-cols-2 gap-2">
                        {ramOptions.map((ram) => (
                            <Checkbox
                                key={ram}
                                checked={tempSpecs.selectedRam.includes(ram)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setTempSpecs({
                                            ...tempSpecs,
                                            selectedRam: [...tempSpecs.selectedRam, ram]
                                        });
                                    } else {
                                        setTempSpecs({
                                            ...tempSpecs,
                                            selectedRam: tempSpecs.selectedRam.filter(r => r !== ram)
                                        });
                                    }
                                }}
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
                                checked={tempSpecs.selectedOS.includes(os)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setTempSpecs({
                                            ...tempSpecs,
                                            selectedOS: [...tempSpecs.selectedOS, os]
                                        });
                                    } else {
                                        setTempSpecs({
                                            ...tempSpecs,
                                            selectedOS: tempSpecs.selectedOS.filter(o => o !== os)
                                        });
                                    }
                                }}
                            >
                                {os}
                            </Checkbox>
                        ))}
                    </div>
                </Panel>
            </Collapse>
        </div>
    );

    const totalSpecsSelected = getTotalSpecsSelected();

    return (
        <Popover
            content={content}
            title={<div className="text-center">Thông số kỹ thuật</div>}
            trigger="click"
            open={popoverVisible}
            onOpenChange={handlePopoverOpen}
            placement="bottomLeft"
            overlayStyle={{ width: '350px' }}
        >
            <Button
                className={`mr-2 flex items-center ${totalSpecsSelected > 0 ? 'bg-blue-100' : ''}`}
            >
                <span>
                    Thông số kỹ thuật {totalSpecsSelected > 0 ? `(${totalSpecsSelected})` : ''}
                </span>
            </Button>
        </Popover>
    );
};

export default SpecificationsFilterButton; 