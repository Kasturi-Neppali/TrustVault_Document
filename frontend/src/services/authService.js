

import api from "./api";

// Login user
export const loginUser = async (email, password) => {
    const response = await api.post("/auth/login", {
        email,
        password
    });

    return response.data;
};

// Register user
export const registerUser = async (
    name,
    email,
    password,
    role
) => {
    const response = await api.post("/auth/register", {
        name,
        email,
        password,
        role
    });

    return response.data;
};

// Logout user
export const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
};
