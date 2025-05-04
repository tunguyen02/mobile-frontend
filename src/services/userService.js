import axios from "axios"
import axiosJWT from "./axiosJWT";
const apiUrl = import.meta.env.VITE_API_URL;
const userApiUrl = `${apiUrl}/user`;

const userService = {
    signIn: async (email, password) => {
        const respond = await axios.post(`${userApiUrl}/auth/login`, {
            email,
            password
        }, {
            withCredentials: true,
        })

        return respond.data;
    },

    register: async (name, email, password, passwordConfirm) => {
        const URL_BACKEND = `${userApiUrl}/auth/signup`;
        const data = {
            name,
            email,
            password,
            passwordConfirm
        }
        const res = await axios.post(URL_BACKEND, data);
        return res;
    },

    forgotPassword: async (email) => {
        try {
            console.log('Calling forgotPassword API with email:', email);
            const response = await axios.post(`${userApiUrl}/auth/forgot-password`, { email });
            console.log('ForgotPassword API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('ForgotPassword API error:', error.response?.data || error.message);
            throw error;
        }
    },

    resetPassword: async (token, password, passwordConfirm) => {
        try {
            console.log('Calling resetPassword API with token:', token);
            const response = await axios.post(`${userApiUrl}/auth/reset-password/${token}`, {
                password,
                passwordConfirm
            });
            console.log('ResetPassword API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('ResetPassword API error:', error.response?.data || error.message);
            throw error;
        }
    },

    getUserInformation: async (accessToken) => {
        const respond = await axiosJWT.get(`${userApiUrl}/user-information`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return respond.data;
    },
    signOut: async () => {
        const response = await axios.post(`${apiUrl}/user/auth/signout`);
        return response.data;
    },
    refreshAccessToken: async () => {
        const respond = await axios.post(`${userApiUrl}/refresh-access-token`,
            {},
            {
                withCredentials: true,     // Lấy cookies chứa refreshToken cho vào req
            }
        );
        return respond.data;
    },
    updateAvatar: async (accessToken, avatarFile) => {
        const formData = new FormData();
        formData.append('avatarImage', avatarFile);

        const response = await axiosJWT.patch(`${userApiUrl}/change-avatar`, formData, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "multipart/form-data",
            }
        });

        return response.data;
    },
    updateProfile: async (accessToken, profile) => {
        const response = await axiosJWT.patch(`${userApiUrl}/update-profile`, profile, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data;
    },

    getAllUsers: async () => {
        const URL_BACKEND = `${userApiUrl}/get-all`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    getUserById: async (userId) => {
        const URL_BACKEND = `${userApiUrl}/get-by-id/${userId}`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    deleteUser: async (userId) => {
        const URL_BACKEND = `${userApiUrl}/delete/${userId}`;
        const res = await axios.delete(URL_BACKEND);
        return res.data;
    },

    countTotalUsers: async () => {
        const URL_BACKEND = `${userApiUrl}/total-users`;
        const res = await axios.get(URL_BACKEND);
        return res.data;
    },

    changePassword: async (accessToken, currentPassword, newPassword, passwordConfirm) => {
        const response = await axiosJWT.post(`${userApiUrl}/auth/change-password`,
            {
                currentPassword,
                newPassword,
                newPasswordConfirm: passwordConfirm
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );
        return response.data;
    },

    getAdminId: async () => {
        try {
            const response = await axios.get(`${apiUrl}/user/admin-id`);
            return response.data;
        } catch (error) {
            console.error('Error fetching admin ID:', error.response || error);
            throw new Error(error.response?.data?.message || 'Error fetching admin ID');
        }
    }
}


export default userService;