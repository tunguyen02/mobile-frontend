import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;

const exportFileService = {
    exportReport: async () => {
        const URL_BACKEND = `${apiUrl}/report/export-file`;
        const res = await axios.get(URL_BACKEND, {
            responseType: "blob",
        });
        return res.data;
    },
};

export default exportFileService;
