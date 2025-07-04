import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;

console.log("Brand service API URL:", apiUrl);

const brandService = {
    getAllBrands: async () => {
        try {
            console.log("Calling API:", `${apiUrl}/brand/get-all`);
            const response = await axios.get(`${apiUrl}/brand/get-all`);
            console.log("Brand API response:", response);
            return response.data;
        } catch (error) {
            console.error("Error in getAllBrands:", error);
            throw error;
        }
    },

    getBrandByName: async (brandName) => {
        const res = await axios.get(`${apiUrl}/brand/brand-by-name/${brandName}`);
        return res.data;
    },

    createBrand: async (brand, image) => {
        const URL_BACKEND = `${apiUrl}/brand/create`;

        const formData = new FormData();
        formData.append("name", brand.name);
        formData.append("description", brand.description);
        formData.append("logoUrl", image);

        const res = await axios.post(URL_BACKEND, formData, {
            headers: {
                "Authorization": `Bearer ${JSON.parse(localStorage.getItem("access_token"))}`,
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    },

    updateBrand: async (brandId, brand, image) => {
        const URL_BACKEND = `${apiUrl}/brand/update/${brandId}`;

        const formData = new FormData();
        formData.append("name", brand.name);
        formData.append("description", brand.description);
        if (image) {
            formData.append("logoUrl", image);
        }

        const res = await axios.put(URL_BACKEND, formData, {
            headers: {
                "Authorization": `Bearer ${JSON.parse(localStorage.getItem("access_token"))}`,
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    },


    deleteBrand: async (brandId) => {
        const URL_BACKEND = `${apiUrl}/brand/delete/${brandId}`;
        await axios.delete(URL_BACKEND, {
            headers: {
                "Authorization": `Bearer ${JSON.parse(localStorage.getItem("access_token"))}`,
            },
        });
    },

    getBrandsWithProductCount: async () => {
        const URL_BACKEND = `${apiUrl}/brand/brands-with-count`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    }
};

export default brandService;
