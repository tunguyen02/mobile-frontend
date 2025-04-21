import axios from 'axios';
import { isJsonString } from "../utils/utils.js";
import { jwtDecode } from "jwt-decode";
import userServices from './userService.js';

const axiosJWT = axios.create();

export const handleGetAccessToken = () => {
    let accessToken = localStorage.getItem("access_token");

    if (accessToken && isJsonString(accessToken)) {
        accessToken = JSON.parse(accessToken);
    }
    return accessToken;
};

axiosJWT.interceptors.request.use(
    async (config) => {
        // Do something before request is sent
        const currentTime = new Date();
        const access_token = handleGetAccessToken();
        const decoded = jwtDecode(access_token);

        if (decoded?.exp < currentTime.getTime() / 1000) {
            const data = await userServices.refreshAccessToken();
            localStorage.setItem('access_token', JSON.stringify(data?.accessToken));
            config.headers["Authorization"] = `Bearer ${data?.accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default axiosJWT;