import axios from "axios";
import axiosJWT from "./axiosJWT";

const flashSaleService = {
    getAllFlashSales: async () => {
        try {
            const response = await axios.get('/api/flash-sale');
            return response.data;
        } catch (error) {
            console.error('Error fetching flash sales:', error);
            throw error;
        }
    },

    getActiveFlashSales: async () => {
        try {
            console.log('Calling getActiveFlashSales API...');
            const response = await axios.get('/api/flash-sale/active');
            console.log('getActiveFlashSales response:', response);
            return response.data;
        } catch (error) {
            console.error('Error fetching active flash sales:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    },

    getFlashSaleById: async (id) => {
        try {
            const response = await axios.get(`/api/flash-sale/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching flash sale with id ${id}:`, error);
            throw error;
        }
    },

    createFlashSale: async (data, accessToken) => {
        try {
            const response = await axiosJWT.post('/api/flash-sale/create', data, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating flash sale:', error);
            throw error;
        }
    },

    updateFlashSale: async (id, data, accessToken) => {
        try {
            const response = await axiosJWT.put(`/api/flash-sale/update/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating flash sale with id ${id}:`, error);
            throw error;
        }
    },

    deleteFlashSale: async (id, accessToken) => {
        try {
            const response = await axiosJWT.delete(`/api/flash-sale/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error deleting flash sale with id ${id}:`, error);
            throw error;
        }
    }
};

export default flashSaleService; 