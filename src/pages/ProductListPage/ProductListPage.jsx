import React, { useEffect, useState } from "react";
import BrandFilterButton from "./BrandFilterButton";
import PriceFilterButton from "./PriceFilterButton";
import SpecificationsFilterButton from "./SpecificationsFilterButton";
import FilterPopover from "./FilterPopover";
import brandService from "../../services/brandService";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Col, Pagination, Row, Select, Button, Tag, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import ProductCard from "../../components/Card/ProductCard";
import Loading from "../../components/Loading/Loading";
import productService from "../../services/productService";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/utils";
import { testBrandAPI } from "../../services/apiTest";

function ProductListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const [sortOrder, setSortOrder] = useState(searchParams.get("sort") || "");

    // Tạo state filters chung cho tất cả các loại filter
    const [filters, setFilters] = useState({
        selectedBrands: searchParams.getAll("brands") || [],
        priceRange: searchParams.get("price") || "",
        selectedBattery: searchParams.getAll("battery") || [],
        selectedCamera: searchParams.getAll("camera") || [],
        selectedStorage: searchParams.getAll("storage") || [],
        selectedRam: searchParams.getAll("ram") || [],
        selectedOS: searchParams.getAll("os") || []
    });

    // State lưu trữ filters đã được áp dụng (chỉ khi nút Lọc được nhấn)
    const [appliedFilters, setAppliedFilters] = useState({ ...filters });

    const [pagination, setPagination] = useState({ page: 1, pageSize: 12 });

    const { data: brands = [], isPending: isBrandsPending } = useQuery({
        queryKey: ["brands"],
        queryFn: async () => {
            console.log("Calling brandService.getAllBrands()");
            const response = await brandService.getAllBrands();
            console.log("Raw API response:", response);
            // The API returns the brands array directly, not wrapped in a data property
            return response;
        },
        enabled: true,
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false
    });

    // Log để debug
    useEffect(() => {
        console.log("Brands data:", brands);
        console.log("Brands structure:", JSON.stringify(brands, null, 2));
        console.log("Brands isPending:", isBrandsPending);
    }, [brands, isBrandsPending]);

    // Test the API directly
    useEffect(() => {
        console.log("Testing API directly...");
        testBrandAPI()
            .then(data => {
                console.log("Direct API test successful:", data);
            })
            .catch(error => {
                console.error("Direct API test failed:", error);
            });
    }, []);

    // Query products với các filter đã APPLY (không phải filters state)
    const { data = [], isPending: isProductsPending } = useQuery({
        queryKey: ["products", {
            searchQuery,
            sortOrder,
            ...appliedFilters,
            ...pagination
        }],
        queryFn: () => {
            const params = { ...pagination };
            if (searchQuery) params.searchQuery = searchQuery;
            if (sortOrder) params.sortOrder = sortOrder;
            if (appliedFilters.selectedBrands.length) params.selectedBrands = appliedFilters.selectedBrands;
            if (appliedFilters.priceRange) params.priceRange = appliedFilters.priceRange;
            if (appliedFilters.selectedBattery.length) params.battery = appliedFilters.selectedBattery;
            if (appliedFilters.selectedCamera.length) params.camera = appliedFilters.selectedCamera;
            if (appliedFilters.selectedStorage.length) params.storage = appliedFilters.selectedStorage;
            if (appliedFilters.selectedRam.length) params.ram = appliedFilters.selectedRam;
            if (appliedFilters.selectedOS.length) params.os = appliedFilters.selectedOS;

            console.log("API request params:", params);

            return productService.getAllProducts(params);
        },
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
    });

    // Hàm áp dụng filters hiện tại
    const applyCurrentFilters = () => {
        setAppliedFilters({ ...filters });
        updateUrlParams({ ...filters });
    };

    // Cập nhật URL từ appliedFilters
    const updateUrlParams = (filters) => {
        const params = new URLSearchParams();

        if (filters.selectedBrands.length) {
            filters.selectedBrands.forEach(brand => params.append("brands", brand));
        }
        if (sortOrder) params.set("sort", sortOrder);
        if (searchQuery) params.set("search", searchQuery);
        if (filters.priceRange) params.set("price", filters.priceRange);

        if (filters.selectedBattery.length) {
            filters.selectedBattery.forEach(battery => params.append("battery", battery));
        }
        if (filters.selectedCamera.length) {
            filters.selectedCamera.forEach(camera => params.append("camera", camera));
        }
        if (filters.selectedStorage.length) {
            filters.selectedStorage.forEach(storage => params.append("storage", storage));
        }
        if (filters.selectedRam.length) {
            filters.selectedRam.forEach(ram => params.append("ram", ram));
        }
        if (filters.selectedOS.length) {
            filters.selectedOS.forEach(os => params.append("os", os));
        }

        setSearchParams(params);
    };

    // Cập nhật URL khi sort order hoặc search query thay đổi
    useEffect(() => {
        updateUrlParams(appliedFilters);
    }, [sortOrder, searchQuery]);

    const handleChangeSortOrder = (value) => {
        setSortOrder(value);
    };

    const onChangePagination = (current, pageSize) => {
        setPagination({
            page: current,
            pageSize,
        })
    };

    const handleCardClick = (product) => {
        navigate(`/product/product-details/${product._id}`);
    };

    // Hàm xóa một filter cụ thể
    const removeFilter = (type, value) => {
        const updatedFilters = { ...filters };

        switch (type) {
            case 'brand':
                updatedFilters.selectedBrands = filters.selectedBrands.filter(b => b !== value);
                break;
            case 'price':
                updatedFilters.priceRange = '';
                break;
            case 'battery':
                updatedFilters.selectedBattery = filters.selectedBattery.filter(b => b !== value);
                break;
            case 'camera':
                updatedFilters.selectedCamera = filters.selectedCamera.filter(c => c !== value);
                break;
            case 'storage':
                updatedFilters.selectedStorage = filters.selectedStorage.filter(s => s !== value);
                break;
            case 'ram':
                updatedFilters.selectedRam = filters.selectedRam.filter(r => r !== value);
                break;
            case 'os':
                updatedFilters.selectedOS = filters.selectedOS.filter(o => o !== value);
                break;
            default:
                break;
        }

        setFilters(updatedFilters);
    };

    // Xóa tất cả filter
    const clearAllFilters = () => {
        const emptyFilters = {
            selectedBrands: [],
            priceRange: '',
            selectedBattery: [],
            selectedCamera: [],
            selectedStorage: [],
            selectedRam: [],
            selectedOS: []
        };
        setFilters(emptyFilters);
    };

    // Kiểm tra có bất kỳ bộ lọc nào được áp dụng
    const hasActiveFilters = appliedFilters.selectedBrands.length > 0 ||
        appliedFilters.priceRange ||
        appliedFilters.selectedBattery.length > 0 ||
        appliedFilters.selectedCamera.length > 0 ||
        appliedFilters.selectedStorage.length > 0 ||
        appliedFilters.selectedRam.length > 0 ||
        appliedFilters.selectedOS.length > 0;

    return (
        <div className="flex justify-center py-10">
            <div className="w-10/12 h-full flex flex-col gap-6 items-center justify-between">
                {/* Top bar with filters and sorting */}
                <div className="flex flex-wrap px-5 justify-between bg-neutral-700 rounded-xl py-4 gap-5 w-full">
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Hiển thị các nút filter riêng biệt */}
                        <BrandFilterButton
                            brands={brands}
                            filters={filters}
                            setFilters={setFilters}
                        />

                        <PriceFilterButton
                            filters={filters}
                            setFilters={setFilters}
                        />

                        <SpecificationsFilterButton
                            filters={filters}
                            setFilters={setFilters}
                        />

                        {/* Nút lọc tổng hợp ở cuối */}
                        <FilterPopover
                            filters={filters}
                            setFilters={setFilters}
                            onClick={applyCurrentFilters}
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <span>Sắp xếp theo: </span>
                        <Select
                            value={sortOrder}
                            style={{
                                width: 120,
                            }}
                            onChange={handleChangeSortOrder}
                            options={[
                                {
                                    value: "",
                                    label: "Mặc định",
                                },
                                {
                                    value: "name-asc",
                                    label: "Tên A->Z",
                                },
                                {
                                    value: "price-asc",
                                    label: "Giá tăng dần",
                                },
                                {
                                    value: "price-desc",
                                    label: "Giá giảm dần",
                                },
                            ]}
                        />
                    </div>
                </div>

                {/* Active filters display */}
                {hasActiveFilters && (
                    <div className="w-full bg-gray-100 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium text-black">Bộ lọc đã chọn:</div>
                            <Button type="link" onClick={clearAllFilters} size="small">
                                Xóa tất cả
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            {appliedFilters.priceRange && (
                                <Tag
                                    closable
                                    onClose={() => removeFilter('price')}
                                    className="px-2 py-1 rounded-full bg-blue-100"
                                >
                                    Giá: {formatCurrency(appliedFilters.priceRange.split('-')[0])} - {formatCurrency(appliedFilters.priceRange.split('-')[1])} đ
                                </Tag>
                            )}

                            {appliedFilters.selectedBrands.map(brand => (
                                <Tag
                                    key={brand}
                                    closable
                                    onClose={() => removeFilter('brand', brand)}
                                    className="px-2 py-1 rounded-full bg-blue-100"
                                >
                                    Hãng: {brand}
                                </Tag>
                            ))}

                            {appliedFilters.selectedBattery.map(battery => {
                                // Phân tích khoảng pin
                                const range = battery.split('-');
                                const minBattery = parseInt(range[0]);
                                const maxBattery = range[1] ? parseInt(range[1]) : null;

                                let batteryLabel;
                                if (maxBattery) {
                                    batteryLabel = `${minBattery} mAh - ${maxBattery} mAh`;
                                } else if (minBattery === 0) {
                                    batteryLabel = `Dưới ${range[1]} mAh`;
                                } else {
                                    batteryLabel = `Trên ${minBattery} mAh`;
                                }

                                return (
                                    <Tag
                                        key={battery}
                                        closable
                                        onClose={() => removeFilter('battery', battery)}
                                        className="px-2 py-1 rounded-full bg-blue-100"
                                    >
                                        Pin: {batteryLabel}
                                    </Tag>
                                );
                            })}

                            {appliedFilters.selectedCamera.map(camera => {
                                // Phân tích khoảng camera
                                const range = camera.split('-');
                                const minCamera = parseInt(range[0]);
                                const maxCamera = range[1] ? parseInt(range[1]) : null;

                                let cameraLabel;
                                if (maxCamera) {
                                    cameraLabel = `${minCamera}MP - ${maxCamera}MP`;
                                } else if (minCamera === 0) {
                                    cameraLabel = `Dưới ${range[1]}MP`;
                                } else {
                                    cameraLabel = `Trên ${minCamera}MP`;
                                }

                                return (
                                    <Tag
                                        key={camera}
                                        closable
                                        onClose={() => removeFilter('camera', camera)}
                                        className="px-2 py-1 rounded-full bg-blue-100"
                                    >
                                        Camera: {cameraLabel}
                                    </Tag>
                                );
                            })}

                            {appliedFilters.selectedStorage.map(storage => (
                                <Tag
                                    key={storage}
                                    closable
                                    onClose={() => removeFilter('storage', storage)}
                                    className="px-2 py-1 rounded-full bg-blue-100"
                                >
                                    Bộ nhớ: {storage}
                                </Tag>
                            ))}

                            {appliedFilters.selectedRam.map(ram => (
                                <Tag
                                    key={ram}
                                    closable
                                    onClose={() => removeFilter('ram', ram)}
                                    className="px-2 py-1 rounded-full bg-blue-100"
                                >
                                    RAM: {ram}
                                </Tag>
                            ))}

                            {appliedFilters.selectedOS.map(os => (
                                <Tag
                                    key={os}
                                    closable
                                    onClose={() => removeFilter('os', os)}
                                    className="px-2 py-1 rounded-full bg-blue-100"
                                >
                                    OS: {os}
                                </Tag>
                            ))}
                        </div>
                    </div>
                )}

                <div className="w-full">
                    <Loading isLoading={isProductsPending}>
                        <Row gutter={[24, 32]}>
                            {data?.products?.map((product) => (
                                <Col key={product?._id} xs={24} sm={12} md={8} lg={6}>
                                    <ProductCard
                                        product={product}
                                        handleCardClick={() => handleCardClick(product)}
                                    />
                                </Col>
                            ))}
                        </Row>

                        {data?.products?.length === 0 && (
                            <div className="flex justify-center p-12 text-xl text-gray-400">
                                Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                            </div>
                        )}
                    </Loading>
                </div>

                <div className="px-5 bg-neutral-300 rounded-xl py-4">
                    <Pagination
                        showSizeChanger
                        onChange={onChangePagination}
                        current={pagination?.page}
                        pageSize={pagination?.pageSize}
                        total={data?.totalProducts}
                        pageSizeOptions={[4, 8, 12, 16, 20]}
                    />
                </div>
            </div>
        </div>
    );
}

export default ProductListPage;
