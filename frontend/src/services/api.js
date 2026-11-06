

import axios from "axios";

// Create one central Axios instance
const api = axios.create({
    baseURL: "http://127.0.0.1:5000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// Automatically attach JWT to protected requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
export const testBackend = async () => {
    const response = await api.get("/health");
    return response.data;
};