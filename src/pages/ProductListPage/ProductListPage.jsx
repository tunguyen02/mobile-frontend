import React, { useEffect, useState } from "react";
import BrandSelector from "./BrandSelector";
import brandService from "../../services/brandService";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Col, Pagination, Row, Select } from "antd";
import ProductCard from "../../components/Card/ProductCard";
import Loading from "../../components/Loading/Loading";
import productService from "../../services/productService";
import { useNavigate } from "react-router-dom";

function ProductListPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const [sortOrder, setSortOrder] = useState(searchParams.get("sort") || "");
    const [selectedBrands, setSelectedBrands] = useState(
        searchParams.getAll("brands") || []
    );
    const [pagination, setPagination] = useState({ page: 1, pageSize: 12 });

    const { data: brands = [], isPending: isBrandsPending } = useQuery({
        queryKey: ["brands"],
        queryFn: () => brandService.getAllBrands(),
        enabled: true,
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
    });

    const { data = [], isPending: isProductsPending } = useQuery({
        queryKey: ["products", { searchQuery, sortOrder, selectedBrands, ...pagination }],
        queryFn: () => {
            const params = { ...pagination };
            if (searchQuery) params.searchQuery = searchQuery;
            if (sortOrder) params.sortOrder = sortOrder;
            if (selectedBrands.length) params.selectedBrands = selectedBrands;

            return productService.getAllProducts(params);
        },
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        const params = new URLSearchParams();

        if (selectedBrands.length) params.set("category", selectedBrands.join(","));
        if (sortOrder) params.set("sort", sortOrder);
        if (searchQuery) params.set("search", searchQuery);
        setSearchParams(params);
    }, [selectedBrands, sortOrder, searchQuery]);

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

    return (
        <div className="flex justify-center py-10">
            <div className="w-10/12 h-full flex flex-col gap-10 items-center justify-between">
                <div className="flex px-5 justify-between bg-neutral-700 rounded-xl py-4 gap-3 w-full">
                    <div className="flex gap-2 items-center">
                        <span>Lọc nhanh: </span>
                        <Loading isLoading={isBrandsPending}>
                            <BrandSelector
                                brands={brands}
                                brandsFilter={selectedBrands}
                                setBrandsFilter={setSelectedBrands}
                            />
                        </Loading>
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

                <div className="pl-8 w-full">
                    <Loading isLoading={isProductsPending}>
                        <Row gutter={[0, 40]}>
                            {data?.products?.map((product) => (
                                <Col key={product?._id} span={6}>
                                    <ProductCard
                                        product={product}
                                        handleCardClick={() => handleCardClick(product)}
                                    />
                                </Col>
                            ))}
                        </Row>
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
