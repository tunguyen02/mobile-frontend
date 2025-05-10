import { Button, Carousel } from "antd";
import productService from "../../services/productService";
import ProductCard from "../../components/Card/ProductCard";
import { useQueries, useQuery } from "@tanstack/react-query";
import brandService from "../../services/brandService";
import Loading from "../../components/Loading/Loading";
import { useNavigate } from "react-router-dom";
import { CaretRightOutlined } from "@ant-design/icons";
import FlashSaleSection from "../../components/FlashSale/FlashSaleSection";

function HomePage() {
    const navigate = useNavigate();

    const sliderItems = [
        {
            height: "480px",
            backgroundImage:
                'url("https://cdnv2.tgdd.vn/mwg-static/topzone/Banner/fc/4a/fc4a56b06365bb9f42d59c6e05d33def.png")',
            backgroundSize: "cover",
        },
        {
            height: "480px",
            backgroundImage:
                'url("https://cdnv2.tgdd.vn/mwg-static/topzone/Banner/ee/58/ee58ca26322d2881aeca1fe2f35a5d38.png")',
            backgroundSize: "cover",
        },
        {
            height: "480px",
            backgroundImage:
                'url("https://cdnv2.tgdd.vn/mwg-static/topzone/Banner/b7/ef/b7efece2b3824c9eea01e1c20beb2fa7.png")',
            backgroundSize: "cover",
        },
        {
            height: "480px",
            backgroundImage:
                'url("https://cdnv2.tgdd.vn/mwg-static/topzone/Banner/38/d7/38d70a75588cebf5d471e8a0e6fa5fdd.png")',
            backgroundSize: "cover",
        },
        {
            height: "480px",
            backgroundImage:
                'url("https://cdnv2.tgdd.vn/mwg-static/topzone/Banner/e6/72/e6725fa42e6bccd4e0d9ff3ff7c02393.jpg")',
            backgroundSize: "cover",
        },
        {
            height: "480px",
            backgroundImage:
                'url("https://cdnv2.tgdd.vn/mwg-static/topzone/Banner/45/11/4511a88521a2cc486825b713c6ccf141.jpg")',
            backgroundSize: "cover",
        },
    ];

    const handleCardClick = (product) => {
        navigate(`/product/product-details/${product._id}`);
    };

    const { data: brands = [], isPending: isBrandPending } = useQuery({
        queryKey: ["brands"],
        queryFn: () => brandService.getAllBrands(),
        enabled: true,
        keepPreviousData: true,
        retry: 3,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });

    const productsOfBrandResults = useQueries({
        queries: brands?.map((brand) => ({
            queryKey: [brand?.name],
            queryFn: () => productService.getProductsByBrand(brand?.name, 12),
            enabled: true,
            keepPreviousData: true,
            retry: 3,
            refetchOnWindowFocus: false,
        })),
    });

    return (
        <div>
            <Carousel autoplay arrows>
                {sliderItems.map((sliderItem) => {
                    return (
                        <div key={sliderItem.backgroundImage}>
                            <div style={sliderItem}></div>
                        </div>
                    );
                })}
            </Carousel>
            
            {/* Flash Sale Section */}
            <FlashSaleSection />
            
            <div className="py-8 px-28">
                <div className="py-8 flex justify-center">
                    <Button
                        onClick={() => navigate("/products")}
                        className="!bg-neutral-800 !text-white !border !border-neutral-600 !rounded-lg flex items-center justify-center
            hover:!border-white !hover:border-4 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition duration-200 px-10 py-6 text-lg font-bold"
                    >
                        Tất cả sản phẩm <CaretRightOutlined />
                    </Button>
                </div>
                {brands?.map((brand, index) => {
                    return (
                        <div key={brand?.name} className="mb-20">
                            <div className="text-4xl font-bold text-white text-center mb-10">
                                {brand?.name}
                            </div>
                            <Loading
                                key={brand?.name}
                                isLoading={productsOfBrandResults[index].isPending}
                            >
                                <Carousel
                                    slidesToShow={4}
                                    slidesToScroll={4}
                                    dots={false}
                                    arrows
                                    infinite
                                    className="min-h-64"
                                >
                                    {productsOfBrandResults
                                        .at(index)
                                        ?.data?.products.map((product) => {
                                            return (
                                                <div
                                                    className="w-1/4 mx-4 py-3 ml-10"
                                                    key={product._id}
                                                >
                                                    <ProductCard product={product} handleCardClick={() => handleCardClick(product)} />
                                                </div>
                                            );
                                        })}
                                </Carousel>
                            </Loading>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default HomePage;
