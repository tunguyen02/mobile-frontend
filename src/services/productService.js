import axios from "axios";
import axiosJWT from "./axiosJWT";
const apiUrl = import.meta.env.VITE_API_URL;

const productService = {
    getAllProducts: async (queries) => {
        const URL_BACKEND = `${apiUrl}/product/get-all`;
        const res = await axios.get(URL_BACKEND, {
            params: queries,
        });
        return res.data;
    },

    getProductById: async (productId) => {
        const URL_BACKEND = `${apiUrl}/product/product-details/${productId}`;
        console.log(URL_BACKEND);

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
            const response = await axios.post(`${apiUrl}/product/compare`, { productIds });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi so sánh sản phẩm:', error);
            throw error;
        }
    },
};

export default productService;
