import axios from "axios";
import axiosJWT from "./axiosJWT";
const apiUrl = import.meta.env.VITE_API_URL;

const productService = {
    getAllProducts: async (queries) => {
        const URL_BACKEND = `${apiUrl}/product/get-all`;
        console.log("Sending API request to:", URL_BACKEND);
        console.log("With queries:", queries);

        // Xử lý các tham số trong queries một cách rõ ràng
        const params = { ...queries };

        // Đảm bảo selectedBrands được gửi đúng cách
        if (params.selectedBrands && Array.isArray(params.selectedBrands)) {
            // Chuyển đổi mảng thành chuỗi nếu có nhiều phần tử
            if (params.selectedBrands.length > 1) {
                params.selectedBrands = params.selectedBrands;
            } else if (params.selectedBrands.length === 1) {
                // Nếu chỉ có một phần tử, không cần mảng
                params.selectedBrands = params.selectedBrands[0];
            }
            console.log("Selected brands processed:", params.selectedBrands);
        }

        const res = await axios.get(URL_BACKEND, {
            params: params,
        });

        console.log("API response:", res.data);
        return res.data;
    },

    getProductById: async (productId) => {
        const URL_BACKEND = `${apiUrl}/product/product-details/${productId}`;
        console.log(URL_BACKEND);

        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    getProductDetail: async (productId) => {
        const URL_BACKEND = `${apiUrl}/product-detail/${productId}`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    getProductBySlug: async (slug) => {
        const URL_BACKEND = `${apiUrl}/product/${slug}`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    getProductsByBrand: async (brandName, limit) => {
        const URL_BACKEND = `${apiUrl}/product/products-of-brand`;
        const respond = await axios.get(
            URL_BACKEND,
            {
                params: {
                    brandName,
                    limit,
                },
            }
        );
        return respond.data;
    },

    createProduct: async (product, images) => {
        const URL_BACKEND = `${apiUrl}/product/create`;
        const formData = new FormData();

        formData.append('brand', product.brand);
        formData.append('name', product.name);
        formData.append('color', product.color);
        formData.append('originalPrice', product.originalPrice);
        formData.append('price', product.price);
        formData.append('countInStock', product.countInStock);
        formData.append('description', product.description);
        images.forEach((image) => {
            formData.append('imageUrl', image.originFileObj);
        });

        const res = await axiosJWT.post(URL_BACKEND, formData, {
            headers: {
                Authorization: `Bearer ${JSON.parse(localStorage.getItem("access_token"))}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    },

    updateProduct: async (productId, product, images) => {
        const URL_BACKEND = `${apiUrl}/product/update/${productId}`;

        const formData = new FormData();
        formData.append('brand', product.brand);
        formData.append('name', product.name);
        formData.append('color', product.color);
        formData.append('originalPrice', product.originalPrice);
        formData.append('price', product.price);
        formData.append('countInStock', product.countInStock);
        formData.append('description', product.description);

        images.forEach((image) => {
            if (image instanceof File) {
                formData.append('imageUrl', image);
            } else {
                formData.append('imageUrl', image);
            }
        });

        const res = await axiosJWT.patch(URL_BACKEND, formData, {
            headers: {
                Authorization: `Bearer ${JSON.parse(localStorage.getItem("access_token"))}`,
            },
        });
        return res.data;
    },


    deleteProduct: async (productId) => {
        const URL_BACKEND = `${apiUrl}/product/delete/${productId}`;
        await axios.delete(URL_BACKEND, {
            headers: {
                Authorization: `Bearer ${JSON.parse(localStorage.getItem("access_token"))}`,
            },
        }
        )
    },

    countTotalProducts: async () => {
        const URL_BACKEND = `${apiUrl}/product/total-products`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    compareProducts: async (productIds) => {
        try {
            console.log('Gửi request so sánh với productIds:', productIds);

            // Đảm bảo productIds luôn là một mảng
            const idsToSend = Array.isArray(productIds) ? productIds : [productIds];

            // Gọi API lấy thông tin cơ bản của sản phẩm
            const response = await axios.post(`${apiUrl}/product/compare`, { productIds: idsToSend });

            // Nếu có dữ liệu trả về, lấy thêm thông tin chi tiết cho từng sản phẩm
            if (response.data.success && response.data.data) {
                const products = response.data.data;

                // Lấy chi tiết cho từng sản phẩm
                const productsWithDetails = await Promise.all(
                    products.map(async (product) => {
                        try {
                            const detailResponse = await axios.get(`${apiUrl}/product-detail/${product._id}`);
                            if (detailResponse.data && detailResponse.data.data) {
                                return {
                                    ...product,
                                    details: detailResponse.data.data
                                };
                            }
                            return product;
                        } catch (error) {
                            console.error(`Lỗi khi lấy chi tiết cho sản phẩm ${product._id}:`, error);
                            return product;
                        }
                    })
                );

                // Trả về kết quả với chi tiết
                return {
                    ...response.data,
                    data: productsWithDetails
                };
            }

            return response.data;
        } catch (error) {
            console.error('Lỗi khi so sánh sản phẩm:', error);
            throw error;
        }
    },

    // Tìm sản phẩm theo khoảng giá
    findProductsByPrice: async (targetPrice, range, limit) => {
        try {
            const params = { targetPrice };
            if (range) params.range = range;
            if (limit) params.limit = limit;

            const response = await axios.get(`${apiUrl}/product/find-by-price`, { params });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tìm sản phẩm theo giá:', error);
            throw error;
        }
    },

    // Tìm sản phẩm theo camera
    findProductsByCamera: async (cameraSpec, limit) => {
        try {
            const params = { cameraSpec };
            if (limit) params.limit = limit;

            const response = await axios.get(`${apiUrl}/product/find-by-camera`, { params });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tìm sản phẩm theo camera:', error);
            throw error;
        }
    },

    // Tìm sản phẩm theo pin
    findProductsByBattery: async (batteryCapacity, limit) => {
        try {
            const params = { batteryCapacity };
            if (limit) params.limit = limit;

            const response = await axios.get(`${apiUrl}/product/find-by-battery`, { params });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tìm sản phẩm theo pin:', error);
            throw error;
        }
    },

    // Tìm sản phẩm cùng loại
    findProductsBySeries: async (productName, limit) => {
        try {
            const params = { productName };
            if (limit) params.limit = limit;

            const response = await axios.get(`${apiUrl}/product/find-by-series`, { params });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tìm sản phẩm cùng loại:', error);
            throw error;
        }
    },

    // Tìm sản phẩm theo dung lượng bộ nhớ
    findProductsByStorage: async (storage, limit) => {
        try {
            const params = { storage };
            if (limit) params.limit = limit;

            const response = await axios.get(`${apiUrl}/product/find-by-storage`, { params });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi tìm sản phẩm theo dung lượng:', error);
            throw error;
        }
    },

    // Lấy danh sách các thông số camera distinct
    getDistinctCameraSpecs: async () => {
        try {
            const response = await axios.get(`${apiUrl}/product/distinct-camera-specs`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thông số camera:', error);
            throw error;
        }
    },

    // Lấy danh sách các dung lượng pin distinct
    getDistinctBatteryCapacities: async () => {
        try {
            const response = await axios.get(`${apiUrl}/product/distinct-battery-capacities`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dung lượng pin:', error);
            throw error;
        }
    },

    // Lấy danh sách các dung lượng bộ nhớ distinct
    getDistinctStorageOptions: async () => {
        try {
            const response = await axios.get(`${apiUrl}/product/distinct-storage-options`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dung lượng bộ nhớ:', error);
            throw error;
        }
    },

    // Lấy danh sách các series sản phẩm distinct
    getDistinctProductSeries: async () => {
        try {
            const response = await axios.get(`${apiUrl}/product/distinct-product-series`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách loại sản phẩm:', error);
            throw error;
        }
    },
};

export default productService;
